import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { Profile } from '../../../models/profile';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('saves model to database as new document', async (ctx) => {
  const context = ctx.get('context');
  const model = new Profile({}, { context }).fake();
  await model.create();
  ctx.is(await context.mongo.db.collection('profiles').countDocuments({ email: model.email }), 1);
});

export default spec;
