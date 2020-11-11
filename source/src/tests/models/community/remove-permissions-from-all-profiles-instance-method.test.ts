import { Spec } from '@hayspec/spec';
import { CommunityPermissionKind } from '../../../config/permissions';
import { Context } from '../../../context';
import { Community } from '../../../models/community';
import { Profile } from '../../../models/profile';
import { UpdateProfileCommunityAbilities } from '../../../models/update-profile-community-abilities';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('removes all community permissions from profiles for current community', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Community({}, { context }).fake().create();
  const profile = await new Profile({}, { context }).fake().create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: profile.id,
    communityAbilities: [
      { communityId: model.id, kind: CommunityPermissionKind.READ },
      { communityId: model.id, kind: CommunityPermissionKind.UPDATE },
      { communityId: model.id, kind: CommunityPermissionKind.DELETE },
    ],
  });
  await updateCommunityAbilities.update();
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => p.communityAbilities.length === 3), true);
  await model.removePermissionsFromAllProfiles();
  ctx.is(await context.mongo.db.collection('profiles').findOne({ _id: profile._id }).then((p) => p.communityAbilities.length === 0), true);
});

export default spec;
