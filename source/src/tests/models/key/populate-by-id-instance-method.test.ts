import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Community } from '../../../models/community';
import { Key } from '../../../models/key';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('populates model based on the provided id', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const newKey = new Key({}, { context });
  await newKey.create(community);
  ctx.is(await newKey.doesExist(community, newKey.id), true);
  const model = new Key({}, { context });
  await model.populateById(community, newKey.id);
  ctx.is((model.key === newKey.key), true);
});

spec.test('fails to populate model with no provided id', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const newKey = new Key({}, { context });
  await newKey.create(community);
  const model = new Key({}, { context });
  await model.populateById(community, null);
  ctx.is(model._id, null);
});

export default spec;
