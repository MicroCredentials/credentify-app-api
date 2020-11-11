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

spec.test('marks document as deleted', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Achievement({}, { context }).fake().create();
  await model.markDeleted();
  const res = await context.mongo.db.collection('achievements').findOne({ _id: model._id });
  ctx.is(res._deletedAt <= Date.now(), true);
});

export default spec;
