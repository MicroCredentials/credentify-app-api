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

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Achievement({}, { context }).fake().create();
  const name = 'newName';

  model.name = name;
  await model.update();
  const res = await context.mongo.db.collection('achievements').findOne({ _id: model._id });
  ctx.is(res.name === name, true);
  ctx.true(res._updatedAt !== null);
});

export default spec;
