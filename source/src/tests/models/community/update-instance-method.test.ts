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

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Community({}, { context }).fake().create();
  const newName = 'newName';

  model.name = newName;
  await model.update();
  const res = await context.mongo.db.collection('communities').findOne({ _id: model._id });
  ctx.is((res.name === newName), true);
});

export default spec;
