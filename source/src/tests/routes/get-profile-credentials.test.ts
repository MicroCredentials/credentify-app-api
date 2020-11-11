import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { RouteErrorCode } from '../../config/types';
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
  credential: Credential;
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
      { kind: ProfilePermissionKind.READ_CREDENTIAL },
    ],
  }).create();

  const authProfile2 = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const achievement = await new Achievement({}, { context }).fake().populate({
    name: 'special',
    communityId: community.id,
  }).create();

  const credential = await new Credential({}, { context }).fake().populate({
    profileId: authProfile.id,
    achievement,
  }).create();

  const achievement2 = await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
  }).create();

  await new Credential({}, { context }).fake().populate({
    profileId: authProfile.id,
    achievement2,
  }).create();

  const achievement3 = await new Achievement({}, { context }).fake().populate({
    communityId: community.id,
  }).create();

  await new Credential({}, { context }).fake().populate({
    profileId: authProfile2.id,
    achievement3,
  }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('credential', credential);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'get',
  });
  ctx.is(res.status, 401);
});

spec.test('handles profile has no communities', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('returns credential with specific id', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const credential = ctx.get('credential');
  const res = await ctx.request({
    url: `/profile/credentials?filterIds[0]=${credential.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns credential with specific achievement name', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/profile/credentials?search="special"',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.data && res.data.data && res.data.data.length === 1, true);
  ctx.is(res.status, 200);
});

spec.test('returns limited credentials', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/profile/credentials?skip=1&limit=1',
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
    && res.data.meta.totalCount === 2
    && res.data.meta.skip === 1
    && res.data.meta.limit === 1
  , true);
  ctx.is(res.status, 200);
});

spec.test('returns all credentials', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(
    res.data
    && res.data.data
    && res.data.data.length === 2
    && res.data.meta
    && res.data.meta.totalCount === 2
    && res.data.meta.skip === 0
    && res.data.meta.limit === 25
  , true);
  ctx.is(res.status, 200);
});

spec.test('handles no credential read ability', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile2');
  const res = await ctx.request({
    url: '/profile/credentials',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_READ_CREDENTIAL).length > 0);
  ctx.is(res.status, 403);
});

export default spec;
