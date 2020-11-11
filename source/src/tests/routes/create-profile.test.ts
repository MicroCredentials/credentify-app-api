import { Spec } from '@hayspec/spec';
import { Context } from '../../context';
import { generateCreateProfileRequestToken } from '../../lib/jwt';
import { CreateProfileRequest } from '../../models/create-profile-request';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  profileRequest: CreateProfileRequest;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const profileRequest = new CreateProfileRequest({}, { context }).fake();
  ctx.set('profileRequest', profileRequest);
});

spec.test('creates profile document', async (ctx) => {
  const profileRequest = ctx.get('profileRequest');
  const context = ctx.get('context');
  const res = await ctx.request({
    url: '/profile',
    method: 'post',
    data: {
      requestToken: generateCreateProfileRequestToken(profileRequest.email, profileRequest.passwordHash, profileRequest.firstName, profileRequest.lastName, context),
    },
  });
  ctx.is(res.status, 201);
  ctx.is(await context.mongo.db.collection('profiles').countDocuments({ email: profileRequest.email }), 1);
});

export default spec;
