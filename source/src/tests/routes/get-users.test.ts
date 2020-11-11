import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Community } from '../../models/community';
import { CreateProfile } from '../../models/create-profile';
import { Profile } from '../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  unauthProfile: Profile;
  community: Community;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const authProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.READ_USER },
    ],
  }).create();
  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();
  await new CreateProfile({}, { context }).fake().populate({
    password: 'notasecret',
    lastName: 'special',
  }).create();

  const community = await new Community({}, { context }).fake().create();
  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ },
    ],
  });
  await updateCommunityAbilities.update();

  ctx.set('community', community);
  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/users',
    method: 'get',
  });
  ctx.is(res.status, 401);
});

spec.test('handles authorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/users',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('returns user with specific id', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const user = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: `/users?filterIds[0]=${user.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns users with specific name', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/users?search="special"',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns users in specific community', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const community = ctx.get('community');
  const res = await ctx.request({
    url: `/users?filterCommunityIds[0]=${community.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns limited users', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/users?skip=1&limit=1',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(
    res.data
    && res.data.data
    && res.data.data.length === 1
    && res.data.meta
    && res.data.meta.totalCount === 3
    && res.data.meta.skip === 1
    && res.data.meta.limit === 1
  , true);
  ctx.is(res.status, 200);
});

spec.test('returns all users', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/users',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(
    res.data
    && res.data.data
    && res.data.data.length === 3
    && res.data.meta
    && res.data.meta.totalCount === 3
    && res.data.meta.skip === 0
    && res.data.meta.limit === 25
  , true);
  ctx.is(res.status, 200);
});

export default spec;
