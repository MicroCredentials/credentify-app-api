import { Spec } from '@hayspec/spec';
import { ObjectId } from 'mongodb';
import { CommunityPermissionKind, KeyPermissionKind, ProfilePermissionKind } from '../../config/permissions';
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
      { communityId: community.id, kind: CommunityPermissionKind.DELETE_KEY_ABILITY },
    ],
  });
  await updateCommunityAbilities.update();

  const key = await new Key({}, { context }).populate({
    keyAbilities: [
      { _id: new ObjectId(), kind: KeyPermissionKind.READ_ASSET },
    ],
  }).create(community);

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
    url: `/communities/${community.id}/keys/${key.id}/abilities/${key.keyAbilities[0].id}`,
    method: 'delete',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('unauthProfile');
  const community = ctx.get('community');
  const key = ctx.get('key');
  const res = await ctx.request({
    url: `/communities/${community.id}/keys/${key.id}/abilities/${key.keyAbilities[0].id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('deletes key ability', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('authProfile');
  const community = ctx.get('community');
  const key = ctx.get('key');
  const res = await ctx.request({
    url: `/communities/${community.id}/keys/${key.id}/abilities/${key.keyAbilities[0].id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(
    res.data
    && res.data.data
    && res.data.data.keyAbilities
    && res.data.data.keyAbilities.length === 0, true);
  ctx.is(res.status, 200);
});

export default spec;
