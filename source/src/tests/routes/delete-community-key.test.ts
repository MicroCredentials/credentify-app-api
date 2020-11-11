import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Community } from '../../models/community';
import { Key } from '../../models/key';
import { Profile } from '../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  unauthProfile: Profile;
  community: Community;
  key: Key;
}>();

spec.before(createContextHelper);
spec.before(startHttpServer);
spec.after(stopHttpServer);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const key = await new Key({}, { context }).create(community);

  const authProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.DELETE_KEY },
    ],
  });
  await updateCommunityAbilities.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('community', community);
  ctx.set('key', key);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const community = ctx.get('community');
  const key = ctx.get('key');
  const res = await ctx.request({
    url: `/communities/${community.id}/keys/${key.id}`,
    method: 'delete',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const key = ctx.get('key');
  const profile = ctx.get('unauthProfile');

  const res = await ctx.request({
    url: `/communities/${community.id}/keys/${key.id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('deletes key from community', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const key = ctx.get('key');
  const profile = ctx.get('authProfile');

  const res = await ctx.request({
    url: `/communities/${community.id}/keys/${key.id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(await key.doesExist(community, key.id), false);
  ctx.is(res.status, 200);
});

export default spec;
