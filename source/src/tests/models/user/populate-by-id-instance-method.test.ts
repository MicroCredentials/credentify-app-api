import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Profile } from '../../../models/profile';
import { User } from '../../../models/user';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('populates model based on the provided id', async (ctx) => {
  const context = ctx.get('context');
  await new Profile({}, { context }).fake().create();
  const model = new User({}, { context });
  const profile = await model.populateById(model._id);
  ctx.is((profile === model), true);
});

spec.test('fails to populate model with no provided id', async (ctx) => {
  const context = ctx.get('context');
  await new Profile({}, { context }).fake().create();
  const model = new User({}, { context });
  const profile = await model.populateById(null);
  ctx.is(profile.email, null);
});

export default spec;
