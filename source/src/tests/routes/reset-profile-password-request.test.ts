import { Spec } from '@hayspec/spec';
import { Context } from '../../context';
import { Profile } from '../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().populate({
    email: 'test@email.com',
  }).create();

  ctx.set('profile', profile);
});

spec.test('sends email', async (ctx) => {
  const res = await ctx.request({
    url: '/profile/reset-password/request',
    method: 'post',
    data: {
      email: 'test@email.com',
    },
  });
  ctx.is(res.status, 201);
});

export default spec;
