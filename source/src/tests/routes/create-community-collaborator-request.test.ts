import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
import { RouteErrorCode } from '../../config/types';
import { Context } from '../../context';
import { generateAuthToken } from '../../lib/jwt';
import { Community } from '../../models/community';
import { Profile } from '../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../helpers/context';
import { startHttpServer, stopHttpServer } from '../helpers/http';

const spec = new Spec<{
  context: Context;
  authProfile: Profile;
  unauthProfile: Profile;
  readProfile: Profile;
  community: Community;
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
      { kind: ProfilePermissionKind.DELETE },
    ],
  }).create();

  const authProfileCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  authProfileCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ },
      { communityId: community.id, kind: CommunityPermissionKind.CREATE_ABILITY },
    ],
  });
  await authProfileCommunityAbilities.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  const readProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.DELETE },
    ],
    communityAbilities: [
      { _id: community.id, kind: CommunityPermissionKind.READ },
    ],
  }).create();

  const readProfileCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  readProfileCommunityAbilities.populate({
    profileId: readProfile.id,
    communityAbilities: [
      { profileId: readProfile.id, communityId: community.id, kind: CommunityPermissionKind.READ },
    ],
  });
  await readProfileCommunityAbilities.update();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('readProfile', readProfile);
  ctx.set('community', community);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const community = ctx.get('community');
  const res = await ctx.request({
    url: `/communities/${community._id.toString()}/collaborators/request`,
    method: 'post',
    data: {
      email: 'xpepermint@gmail.com',
    },
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const community = ctx.get('community');
  const profile = ctx.get('unauthProfile');
  const context = ctx.get('context');
  const res = await ctx.request({
    url: `/communities/${community._id.toString()}/collaborators/request`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      email: 'xpepermint@gmail.com',
    },
  });
  ctx.is(res.status, 403);
});

spec.test('handles wrong permissions', async (ctx) => {
  const community = ctx.get('community');
  const profile = ctx.get('readProfile');
  const context = ctx.get('context');
  const res = await ctx.request({
    url: `/communities/${community._id.toString()}/collaborators/request`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      email: 'xpepermint@gmail.com',
    },
  });
  ctx.is(res.status, 403);
  ctx.true(res.data.errors.filter((error) => error.code === RouteErrorCode.NOT_AUTHORIZED_TO_CREATE_COMMUNITY_ABILITY).length > 0);
});

spec.test('sends email', async (ctx) => {
  const community = ctx.get('community');
  const profile = ctx.get('authProfile');
  const context = ctx.get('context');
  const res = await ctx.request({
    url: `/communities/${community._id.toString()}/collaborators/request`,
    method: 'post',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
    data: {
      email: 'xpepermint@gmail.com',
    },
  });
  ctx.is(res.status, 201);
});

export default spec;
