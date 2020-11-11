import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateResetProfilePasswordRequestToken } from '../../lib/jwt';
import { Profile } from '../../models/profile';
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
      { kind: ProfilePermissionKind.RESET_PASSWORD },
    ],
  }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/profile/reset-password',
    method: 'put',
    data: {
      password: 'newpassword',
      requestToken: generateResetProfilePasswordRequestToken(profile.email, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('updates profile\'s password', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/profile/reset-password',
    method: 'put',
    data: {
      password: 'newpassword',
      requestToken: generateResetProfilePasswordRequestToken(profile.email, context),
    },
  });
  const passwordHash = profile.passwordHash;
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => { return p.passwordHash !== passwordHash; }), true);
  ctx.is(res.status, 200);
});

export default spec;
