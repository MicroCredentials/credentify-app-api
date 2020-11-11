import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken, generateCreateCommunityCollaboratorRequestToken } from '../../lib/jwt';
import { ObjectId } from '../../models/base';
import { Profile } from '../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  profile: Profile;
  unAuthProfile: Profile;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();
  ctx.set('profile', profile);

  const unAuthProfile = await new Profile({}, { context }).fake().create();
  ctx.set('unAuthProfile', unAuthProfile);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: `/communities/${fakeCommunity.toHexString()}/collaborators`,
    method: 'post',
    data: {
      requestToken: generateCreateCommunityCollaboratorRequestToken(profile.email, fakeCommunity, context),
    },
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const profile = ctx.get('unAuthProfile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: `/communities/${fakeCommunity.toHexString()}/collaborators`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateCreateCommunityCollaboratorRequestToken(profile.email, fakeCommunity, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('Handles no token', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: `/communities/${fakeCommunity.toHexString()}/collaborators`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('Handles wrong token email', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: `/communities/${fakeCommunity.toHexString()}/collaborators`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateCreateCommunityCollaboratorRequestToken('test@test.com', fakeCommunity, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('Handles wrong token communityId', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: '/communities/1/collaborators',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateCreateCommunityCollaboratorRequestToken(profile.email, fakeCommunity, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('Adds a new collaborator', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const fakeCommunity = new ObjectId();
  const res = await ctx.request({
    url: `/communities/${fakeCommunity.toHexString()}/collaborators`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateCreateCommunityCollaboratorRequestToken(profile.email, fakeCommunity, context),
    },
  });
  ctx.is(res.status, 201);
  const mongoRes = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is(mongoRes.communityAbilities.length, 2);
});

export default spec;
