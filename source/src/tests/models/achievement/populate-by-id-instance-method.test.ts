import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Achievement } from '../../../models/achievement';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('populates model based on the provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Achievement({}, { context }).fake().create();
  const achievement = await model.populateById(model._id);
  ctx.is((achievement === model), true);
});

spec.test('fails to populate model with no provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Achievement({}, { context }).fake().create();
  const achievement = await model.populateById(null);
  ctx.is(achievement.name, null);
});

export default spec;
