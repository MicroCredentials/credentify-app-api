import { Spec } from '@hayspec/spec';
import { CredentialStage } from '../../../config/types';
import { Context } from '../../../context';
import { Credential } from '../../../models/credential';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Credential({}, { context }).fake().create();

  model.stage = CredentialStage.COMPLETED;
  await model.update();
  const res = await context.mongo.db.collection('credentials').findOne({ _id: model._id });
  ctx.true(res.stage === CredentialStage.COMPLETED);
});

export default spec;
