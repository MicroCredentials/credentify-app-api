import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
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
      { kind: ProfilePermissionKind.CREATE_COMMUNITY },
    ],
  }).create();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const res = await ctx.request({
    url: '/communities',
    method: 'post',
    data: {
      name: 'communityName',
      description: 'communityDescription',
    },
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: '/communities',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'communityName',
      description: 'communityDescription',
    },
  });
  ctx.is(res.status, 403);
});

spec.test('creates community document', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const res = await ctx.request({
    url: '/communities',
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      name: 'communityName',
      description: 'communityDescription',
    },
  });
  ctx.is(await context.mongo.db.collection('communities').countDocuments({ name: 'communityName' }), 1);
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => { return p.communityAbilities.length > 0; }), true);
  ctx.is(res.status, 201);
});

export default spec;
