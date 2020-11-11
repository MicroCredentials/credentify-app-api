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

spec.test('populates model based on the provided community ability id', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const model = await new Profile({}, { context }).fake().create();

  const updateCommunityAbilities = new UpdateProfileCommunityAbilities({}, { context });
  updateCommunityAbilities.populate({
    profileId: model.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ },
      { communityId: community.id, kind: CommunityPermissionKind.DELETE_ABILITY },
    ],
  });
  await updateCommunityAbilities.update();
  await model.populateById(model.id);

  const profile = await model.populateByCommunityAbilityId(model.communityAbilities[0].id);
  ctx.is((profile === model), true);
});

spec.test('fails to populate model with no community ability provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Profile({}, { context }).fake().create();
  const profile = await model.populateByCommunityAbilityId(null);
  ctx.is(profile.email, null);
});

export default spec;
