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
  unauthProfile: Profile;
  authProfileRead: Profile;
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
    ],
  }).create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: authProfile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.DELETE },
    ],
  });
  await updateCommunityAbilities.update();

  const authProfileRead = await new Profile({}, { context }).fake().populate({}).create();
  const updateCommunityAbilitiesRead = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilitiesRead.populate({
    profileId: authProfileRead.id,
    communityAbilities: [
      { profileId: authProfileRead.id, communityId: community.id, kind: CommunityPermissionKind.READ },
    ],
  });
  await updateCommunityAbilitiesRead.update();

  const unauthProfile = await new Profile({}, { context }).fake().populate({
    password: 'notasecret',
  }).create();

  ctx.set('authProfile', authProfile);
  ctx.set('unauthProfile', unauthProfile);
  ctx.set('authProfileRead', authProfileRead);
  ctx.set('community', community);
});

spec.test('handles unauthenticated access', async (ctx) => {
  const community = ctx.get('community');
  const res = await ctx.request({
    url: `/communities/${community.id}`,
    method: 'delete',
  });
  ctx.is(res.status, 401);
});

spec.test('handles unauthorized access', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const profile = ctx.get('unauthProfile');

  const res = await ctx.request({
    url: `/communities/${community.id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(res.status, 403);
});

spec.test('marks community as deleted and removes community permissions from profiles', async (ctx) => {
  const context = ctx.get('context');
  const community = ctx.get('community');
  const profile = ctx.get('authProfile');
  const profileRead = ctx.get('authProfileRead');

  const res = await ctx.request({
    url: `/communities/${community.id}`,
    method: 'delete',
    headers: {
      'Authorization': generateAuthToken(profile.id, context),
    },
  });
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => { return p.communityAbilities.length === 0; }), true);
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profileRead._id }).then((p) => { return p.communityAbilities.length === 0; }), true);
  ctx.is(res.status, 200);
});

export default spec;
