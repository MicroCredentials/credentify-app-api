import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { RouteErrorCode, ValidatorErrorCode } from '../../config/types';
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
    ],
  }).create();

  const authProfile2 = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.CREATE_ACHIEVEMENT },
    ],
  });
  await updateCommunityAbilities.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('community', community);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const community = ctx.get('community');
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const community = ctx.get('community');
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('creates new community achievement', async (ctx) => {
  const community = ctx.get('community');
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'name',
      tag: ['degree'],
      dependentAchievementIds: [],
    },
  });

  const achievements = await context.mongo.db.collection('achievements').find().toArray();
  ctx.is(achievements.length, 1);
  ctx.is(achievements[0].publisherId, profile.id.toString());
  ctx.is(res.status, 201);
});

spec.test('creates new community achievement with dependants', async (ctx) => {
  const community = ctx.get('community');
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const dependentAchievement = await new Achievement({}, { context }).fake().create();
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'name',
      tag: ['degree'],
      dependentAchievementIds: [dependentAchievement.id],
    },
  });

  ctx.is(res.data.data.dependentAchievementIds.length, 1);
  ctx.is(await context.mongo.db.collection('achievements').find().count(), 2);
  ctx.is(res.status, 201);
});

spec.test('handles no create achievement permission', async (ctx) => {
  const community = ctx.get('community');
  const context = ctx.get('context');
  const profile = ctx.get('authProfile2');
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'name',
      tag: ['degree'],
      dependentAchievementIds: [],
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_COMMUNITY_ACHIEVEMENT).length > 0);
  ctx.is(res.status, 403);
});

spec.test('handles non existing depending achievement', async (ctx) => {
  const community = ctx.get('community');
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: `/communities/${community.id}/achievements`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'name',
      tag: ['degree'],
      dependentAchievementIds: ['1'],
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === ValidatorErrorCode.ACHIEVEMENT_DEPENDANTS_NOT_VALID).length > 0);
  ctx.is(res.status, 422);
});

export default spec;
