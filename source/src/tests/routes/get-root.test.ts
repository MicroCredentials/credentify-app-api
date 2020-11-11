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

spec.test('responds with server info', async (ctx) => {
  const res = await ctx.request({
    url: '/',
    method: 'get',
  });
  ctx.is(res.status, 200);
  ctx.is(res.data.data.name, 'Credentify API');
  ctx.is(res.data.data.description, 'The new standard in e-signatures');
  ctx.is(res.data.data.uptime > 0, true);
  ctx.is(res.data.data.version, '0.0.1');
});

export default spec;
