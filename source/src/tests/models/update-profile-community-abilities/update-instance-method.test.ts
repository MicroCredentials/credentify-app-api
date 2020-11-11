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

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().create();
  const community = await new Community({}, { context }).fake().create();
  const model = new UpdateProfileCommunityAbilities({}, { context });
  model.populate({
    profileId: profile.id,
    communityAbilities: [
      { communityId: community.id, kind: CommunityPermissionKind.READ },
    ],
  });
  await model.update();

  const res = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is((res.communityAbilities && res.communityAbilities[0] && res.communityAbilities[0].kind === CommunityPermissionKind.READ), true);
});

export default spec;
