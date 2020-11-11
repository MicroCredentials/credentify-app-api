import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { Profile } from '../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  profile: Profile;
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
});

spec.test('returns authentication token', async (ctx) => {
  const profile = ctx.get('profile');
  const res = await ctx.request({
    url: '/profile/auth',
    method: 'post',
    data: {
      email: profile.email,
      password: 'notasecret',
    },
  });
  ctx.is(res.status, 200);
  ctx.true(!!res.data.data.authToken);
});

export default spec;
