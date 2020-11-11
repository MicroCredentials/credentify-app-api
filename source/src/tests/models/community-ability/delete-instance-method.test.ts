import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { CommunityAbility } from '../../../models/community-ability';
import { Profile } from '../../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('deletes a profile payment', async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().create();
  const communityAbility = await new CommunityAbility({}, { context }).fake().create(profile);
  await communityAbility.delete(profile);
  const res = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is(res.profilePayments.length, 0);
});

export default spec;
