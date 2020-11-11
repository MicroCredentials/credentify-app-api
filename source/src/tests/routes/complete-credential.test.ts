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
  credentialPending2: Credential;
  credentialComplete: Credential;
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
      { kind: ProfilePermissionKind.FINALISE_CREDENTIAL },
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

  const credentialPending = await new Credential({
    community,
    achievement,
    profileId: authProfile2.id,
    stage: CredentialStage.PENDING,
  }, { context }).create();

  const credentialComplete = await new Credential({
    community,
    achievement: achievement2,
    profileId: authProfile2.id,
    stage: CredentialStage.COMPLETED,
  }, { context }).create();

  const achievementWithDependency = await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
    dependentAchievementIds: [achievement.id],
  }).create();

  const credentialPending2 = await new Credential({
    community,
    achievement: achievementWithDependency,
    profileId: authProfile2.id,
    stage: CredentialStage.PENDING,
  }, { context }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('credentialPending', credentialPending);
  ctx.set('credentialPending2', credentialPending2);
  ctx.set('credentialComplete', credentialComplete);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const credential = ctx.get('credentialPending');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const credential = ctx.get('credentialPending');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.skip('marks credential as completed', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialPending');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      grade: 'A',
      creditsAwarded: 6,
      expiryPeriod: new Date(),
      cheating: 'Nope',
    },
  });

  const completedCredential = await context.mongo.db.collection('credentials').findOne({ _id: credential._id });
  ctx.true(completedCredential.stage === CredentialStage.COMPLETED);
  ctx.true(completedCredential.creditsAwarded === 6);
  ctx.is(completedCredential.awardingBodyId, profile.id.toString());
  ctx.is(res.status, 200);
});

spec.skip('handles pending dependant credential', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialPending2');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === ValidatorErrorCode.CREDENTIAL_CONDITIONS_NOT_MET).length > 0);
  ctx.is(res.status, 422);
});

spec.test('handles no finalise credential permission', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile2');
  const credential = ctx.get('credentialPending');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_FINALISE_CREDENTIAL).length > 0);
  ctx.is(res.status, 403);
});

spec.test('handles credential not in valid stage', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credentialComplete');
  const res = await ctx.request({
    url: `/credentials/${credential.id}/complete`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.CREDENTIAL_IN_INVALID_STAGE).length > 0);
  ctx.is(res.status, 403);
});

export default spec;
