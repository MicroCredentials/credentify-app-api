import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken, generateResetProfileEmailRequestToken } from '../../lib/jwt';
import { Profile } from '../../models/profile';
import { ResetProfileEmailRequest } from '../../models/reset-profile-email-request';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  emailResetRequest: ResetProfileEmailRequest;
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
  const emailResetRequest = new ResetProfileEmailRequest({}, { context }).fake().populate({
    newEmail: 'new.email@domain.com',
  });

  const authProfile = await new Profile({}, { context }).fake().populate({
    email: 'me@domain.com',
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.RESET_EMAIL },
    ],
  }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    email: 'test@email.com',
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('emailResetRequest', emailResetRequest);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const context = ctx.get('context');
  const emailResetRequest = ctx.get('emailResetRequest');
  const res = await ctx.request({
    url: '/profile/reset-email',
    method: 'put',
    data: {
      requestToken: generateResetProfileEmailRequestToken(emailResetRequest.newEmail, context),
    },
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const emailResetRequest = ctx.get('emailResetRequest');
  const res = await ctx.request({
    url: '/profile/reset-email',
    method: 'put',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateResetProfileEmailRequestToken(emailResetRequest.newEmail, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('updates profile\'s email', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const emailResetRequest = ctx.get('emailResetRequest');
  const res = await ctx.request({
    url: '/profile/reset-email',
    method: 'put',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      requestToken: generateResetProfileEmailRequestToken(emailResetRequest.newEmail, context),
    },
  });
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => { return p.email === emailResetRequest.newEmail; }), true);
  ctx.is(res.status, 200);
});

export default spec;
