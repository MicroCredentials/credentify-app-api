import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Credential } from '../../../models/credential';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('populates model based on the provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Credential({}, { context }).fake().create();
  const credential = await model.populateById(model._id);
  ctx.is((credential === model), true);
});

spec.test('fails to populate model with no provided id', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Credential({}, { context }).fake().create();
  const credential = await model.populateById(null);
  ctx.is(credential.stage, null);
});

export default spec;
