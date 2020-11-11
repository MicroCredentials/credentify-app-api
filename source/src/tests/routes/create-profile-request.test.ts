import { Spec } from '@hayspec/spec';
import { Context } from '../../context';
import { closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);

spec.test('sends email', async (ctx) => {
  const res = await ctx.request({
    url: '/profile/request',
    method: 'post',
    data: {
      email: 'xpepermint@gmail.com',
      password: '12345678',
      firstName: 'fistNameEx',
      lastName: 'lastNameEx',
    },
  });
  ctx.is(res.status, 201);
});

export default spec;
