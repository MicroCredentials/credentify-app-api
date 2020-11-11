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

spec.test('saves model to database as new document', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Credential({}, { context }).fake().create();
  ctx.is(await context.mongo.db.collection('credentials').countDocuments({ _id: model._id }), 1);
});

export default spec;
