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
  profile: Profile;
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
      { kind: ProfilePermissionKind.CREATE_COMMUNITY },
    ],
  }).create();
  ctx.set('profile', authProfile);
});

spec.test('creates profile payment', async (ctx) => {
  const profile = ctx.get('profile');
  const context = ctx.get('context');
  const profilePayment = await new ProfilePayment().fake();
  const res = await ctx.request({
    url: '/profile/payments',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      ...profilePayment,
    },
  });
  ctx.is(res.status, 201);

  const mongoRes = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is(mongoRes.profilePayments.length, 1);
});

export default spec;
