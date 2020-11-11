import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind, ProfilePermissionKind } from '../../config/permissions';
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
  authProfile2: Profile;
  unauthProfile: Profile;
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

  const authProfile2 = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.DELETE },
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ },
      { communityId: community.id, kind: CommunityPermissionKind.READ_ABILITY },
    ],
  });
  await updateCommunityAbilities.update();
  updateCommunityAbilities.profileId = authProfile2._id;
  await updateCommunityAbilities.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();
  ctx.set('authProfile', authProfile);
  ctx.set('authProfile2', authProfile2);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('community', community);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const community = ctx.get('community');
  const profile2 = ctx.get('authProfile2');
  const res = await ctx.request({
    url: `/communities/${community.id}/collaborators/${profile2.id}`,
    method: 'get',
  });

  ctx.is(res.status, 401);
});

spec.test('handles authorized access', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const profile = ctx.get('unauthProfile');
  const profile2 = ctx.get('authProfile2');
  const res = await ctx.request({
    url: `/communities/${community.id}/collaborators/${profile2.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(res.status, 403);
});

spec.test('handles trying to get a non collaborator', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const profile = ctx.get('authProfile');
  const profile2 = ctx.get('unauthProfile');
  const res = await ctx.request({
    url: `/communities/${community.id}/collaborators/${profile2.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(res.status, 200);
  ctx.true(res.data && res.data.data === null);
});

spec.test('returns community collaborator', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const profile = ctx.get('authProfile');
  const profile2 = ctx.get('authProfile2');
  const res = await ctx.request({
    url: `/communities/${community.id}/collaborators/${profile2.id}`,
    method: 'get',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });

  ctx.is(res.status, 200);
  ctx.true(res.data && res.data.data && res.data.data.id === profile2.id.toString());
});

export default spec;
