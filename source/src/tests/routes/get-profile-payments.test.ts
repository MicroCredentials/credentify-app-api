import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Profile } from '../../models/profile';
import { ProfilePayment } from '../../models/profile-payment';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  unauthProfile: Profile;
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
    ],
  }).create();
  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();
  await new ProfilePayment({}, { context }).fake().create(authProfile);
  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/profile/payments',
    method: 'get',
  });
  ctx.is(res.status, 401);
});

spec.test('handles authorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/profile/payments',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('gets profile payments', async (ctx) => {
  const profile = ctx.get('authProfile');
  const context = ctx.get('context');
  const res = await ctx.request({
    url: '/profile/payments',
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 200);
  ctx.is(res.data.data.length, 1);
});

export default spec;
