import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Profile } from '../../../models/profile';
import { ProfilePayment } from '../../../models/profile-payment';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('creates a new profile payment', async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().create();
  await new ProfilePayment({ profileId: profile._id }, { context }).fake().create(profile);
  const res = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is(res.profilePayments.length, 1);
});

export default spec;
