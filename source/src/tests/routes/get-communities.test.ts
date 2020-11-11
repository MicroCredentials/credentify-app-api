import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Community } from '../../models/community';
import { Profile } from '../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  unauthProfile: Profile;
  community1: Community;
  community2: Community;
  community3: Community;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');

  const community1 = await new Community({}, { context }).fake().create();
  const community2 = await new Community({}, { context }).fake().create();
  const community3 = await new Community({}, { context }).fake().populate({
    name: 'Special name',
    description: 'Special description',
  }).create();
  await new Community({}, { context }).fake().create();

  const authProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.DELETE },
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community1.id, kind: CommunityPermissionKind.READ },
      { communityId: community2.id, kind: CommunityPermissionKind.READ },
      { communityId: community2.id, kind: CommunityPermissionKind.CREATE_KEY_ABILITY },
      { communityId: community2.id, kind: CommunityPermissionKind.UPDATE_ACHIEVEMENT },
      { communityId: community3.id, kind: CommunityPermissionKind.READ },
      { communityId: community3.id, kind: CommunityPermissionKind.CREATE_KEY_ABILITY },
    ],
  });
  await updateCommunityAbilities.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();
  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('community1', community1);
  ctx.set('community2', community2);
  ctx.set('community3', community3);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/communities',
    method: 'get',
  });
  ctx.is(res.status, 401);
});

spec.test('handles profile has no communities', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/communities',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('returns community data with specific id', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const community = ctx.get('community1');
  const res = await ctx.request({
    url: `/communities?filterIds[0]=${community.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns community data with specific name', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/communities?search="special"',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns community data with specific abilities', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: `/communities?filterPermissionKinds[0]=${CommunityPermissionKind.CREATE_KEY_ABILITY}&filterPermissionKinds[1]=${CommunityPermissionKind.UPDATE_ACHIEVEMENT}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);

  const res2 = await ctx.request({
    url: `/communities?filterPermissionKinds[0]=${CommunityPermissionKind.CREATE_KEY_ABILITY}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res2.data && res2.data.data && res2.data.data.length === 2, true);
  ctx.is(res2.status, 200);
});

spec.test('returns limited communities data', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/communities?skip=1&limit=1',
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

export default spec;
