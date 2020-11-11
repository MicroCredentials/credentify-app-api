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
  community: Community;
  achievement: Achievement;
  achievementWithDependencies: Achievement;
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
      { kind: ProfilePermissionKind.REQUEST_CREDENTIAL },
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
    dependentAchievementIds: [achievement.id],
  }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('achievement', achievement);
  ctx.set('achievementWithDependencies', achievement2);
  ctx.set('community', community);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('creates new credential request', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const achievement = ctx.get('achievement');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      achievementId: achievement.id,
    },
  });

  ctx.is(await context.mongo.db.collection('credentials').find().count(), 1);
  ctx.is(res.status, 201);
});

spec.test('handles duplicate requests', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const achievement = ctx.get('achievement');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      achievementId: achievement.id,
    },
  });

  ctx.is(res.status, 201);

  const res2 = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      achievementId: achievement.id,
    },
  });

  ctx.true(res2.data.errors.filter((error) => error.code === RouteErrorCode.CREDENTIAL_REQUEST_ALREADY_EXIST).length > 0);
  ctx.is(res2.status, 400);
});

spec.test('creates a new credential with dependants request', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const community = ctx.get('community');
  const achievement = ctx.get('achievement');
  const achievement2 = ctx.get('achievementWithDependencies');

  await new Credential({
    community,
    achievement,
    profileId: profile.id,
    stage: CredentialStage.COMPLETED,
  }, { context }).create();

  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      achievementId: achievement2.id,
    },
  });

  ctx.is(await context.mongo.db.collection('credentials').find().count(), 2);
  ctx.is(res.status, 201);
});

spec.test('handles no create credential permission', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile2');
  const achievement = ctx.get('achievement');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      achievementId: achievement.id,
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_REQUEST_CREDENTIAL).length > 0);
  ctx.is(res.status, 403);
});

export default spec;
