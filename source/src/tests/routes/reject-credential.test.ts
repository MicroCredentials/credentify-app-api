import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { CredentialStage, RouteErrorCode, ValidatorErrorCode } from '../../config/types';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Achievement } from '../../models/achievement';
import { Community } from '../../models/community';
import { Credential } from '../../models/credential';
import { Profile } from '../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  authProfile2: Profile;
  unauthProfile: Profile;
  credentialPending: Credential;
  credentialRequest: Credential;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();

  const authProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.MANAGE_REQUEST_CREDENTIAL },
    ],
  }).create();

  const authProfile2 = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const achievement = await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
  }).create();

  const achievement2 = await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
  }).create();

  const credentialRequest = await new Credential({
    community,
    achievement,
    profileId: authProfile2.id,
    stage: CredentialStage.REQUEST,
    wallet: '0xB257f4eF17c81Eb4d15A741A8D09e1EBb3953201',
  }, { context }).create();

  const credentialPending = await new Credential({
    community,
    achievement: achievement2,
    profileId: authProfile2.id,
    stage: CredentialStage.PENDING,
    wallet: '0xB257f4eF17c81Eb4d15A741A8D09e1EBb3953201',
  }, { context }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('credentialPending', credentialPending);
  ctx.set('credentialRequest', credentialRequest);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const credential = ctx.get('credentialRequest');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const credential = ctx.get('credentialRequest');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('marks credential as rejected', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialRequest');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true((await context.mongo.db.collection('credentials').findOne({ _id: credential._id })).stage === CredentialStage.REJECTED);
  ctx.is(res.status, 200);
});

spec.test('marks credential as rejected and adds a note', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialRequest');
  const note = 'test';
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      note,
    },
  });

  const dbCredential = await context.mongo.db.collection('credentials').findOne({ _id: credential._id });
  ctx.true(dbCredential.stage === CredentialStage.REJECTED && dbCredential.note === note);
  ctx.is(res.status, 200);
});

spec.test('handles no manage request credential permission', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile2');
  const credential = ctx.get('credentialRequest');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_MANAGE_REQUEST_CREDENTIAL).length > 0);
  ctx.is(res.status, 403);
});

spec.test('handles credential not in valid stage', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialPending');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/reject`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.CREDENTIAL_IN_INVALID_STAGE).length > 0);
  ctx.is(res.status, 403);
});

export default spec;
