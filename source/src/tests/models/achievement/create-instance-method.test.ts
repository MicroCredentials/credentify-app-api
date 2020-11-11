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

spec.test('saves model to database as new document', async (ctx) => {
  const context = ctx.get('context');
  const model = new Achievement({}, { context }).fake();
  await model.create();
  ctx.is(await context.mongo.db.collection('achievements').countDocuments({ name: model.name }), 1);
});

export default spec;
