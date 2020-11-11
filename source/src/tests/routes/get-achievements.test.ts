import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Achievement } from '../../models/achievement';
import { Community } from '../../models/community';
import { Profile } from '../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  authProfile2: Profile;
  unauthProfile: Profile;
  community: Community;
  achievement: Achievement;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const community2 = await new Community({}, { context }).fake().create();

  const authProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ_ACHIEVEMENT },
      { communityId: community2.id, kind: CommunityPermissionKind.READ_ACHIEVEMENT },
    ],
  });
  await updateCommunityAbilities.update();

  const authProfile2 = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const achievement = await new Achievement({}, { context }).fake().populate({
    name: 'special',
    communityId: community.id,
    tag: ['tag1', 'tag2'],
  }).create();

  await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
    tag: ['tag1'],
  }).create();

  await new Achievement({}, { context }).fake().populate({
    communityId: community2.id,
    tag: ['tag2'],
  }).create();

  await new Achievement({}, { context }).fake().create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('community', community);
  ctx.set('achievement', achievement);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/achievements',
    method: 'get',
  });
  ctx.is(res.status, 401);
});

spec.test('returns achievement with specific id', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const achievement = ctx.get('achievement');
  const res = await ctx.request({
    url: `/achievements?filterIds[0]=${achievement.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns achievements for specific community', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const community = ctx.get('community');

  const res = await ctx.request({
    url: `/achievements?filterCommunityIds[0]=${community.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 2, true);
  ctx.is(res.status, 200);
});

spec.test('returns achievements with specific name', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/achievements?search="special"',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns achievements with specific tag', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/achievements?filterTags[0]=tag1',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 2, true);
  ctx.is(res.status, 200);

  const res2 = await ctx.request({
    url: '/achievements?filterTags[0]=tag1&filterTags[1]=tag2',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res2.data && res2.data.data && res2.data.data.length === 3, true);
  ctx.is(res2.status, 200);
});

spec.test('returns limited achievements', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/achievements?skip=1&limit=1',
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

spec.test('returns all achievements', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/achievements',
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
