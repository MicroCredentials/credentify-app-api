import { Spec } from '@hayspec/spec';
import { ProfilePermissionKind } from '../../../config/permissions';
import { PopulateStrategy } from '../../../config/types';
import { Context } from '../../../context';
import { AuthProfile } from '../../../models/auth-profile';
import { Profile } from '../../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
  profile: Profile;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.beforeEach(async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().populate({
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
    ],
  }).create();
  ctx.set('profile', profile);
});

spec.test('sets model `id`', async (ctx) => {
  const context = ctx.get('context');
  const profile = ctx.get('profile');
  const model = new AuthProfile({}, { context }).fake();
  model.populate(profile, PopulateStrategy.PROFILE);
  ctx.false(!!model.id);
  await model.authenticate();
  ctx.true(!!model.id);
});

export default spec;
