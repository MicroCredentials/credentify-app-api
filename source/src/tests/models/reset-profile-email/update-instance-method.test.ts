import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Profile } from '../../../models/profile';
import { ResetProfileEmail } from '../../../models/reset-profile-email';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const newEmail = 'new.email@domain.com';
  const profile = await new Profile({}, { context }).fake().create();
  const model = new ResetProfileEmail({ _id: profile.id, email: newEmail }, { context });
  await model.update();
  const res = await context.mongo.db.collection('profiles').findOne({ _id: profile._id });
  ctx.is((res.email === newEmail), true);
});

export default spec;
