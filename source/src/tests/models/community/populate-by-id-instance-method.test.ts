import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Community } from '../../../models/community';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('populates model based on the provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Community({}, { context }).fake().create();
  const community = await model.populateById(model._id);
  ctx.is((community === model), true);
});

spec.test('fails to populate model with no provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Community({}, { context }).fake().create();
  const community = await model.populateById(null);
  ctx.is(community.name, null);
});

export default spec;
