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

spec.test('updates document in the database', async (ctx) => {
  const context = ctx.get('context');
  const model = await new Profile({}, { context }).fake().create();
  const firstName = 'newName';
  const lastName = 'newLastName';

  model.firstName = firstName;
  model.lastName = lastName;
  await model.update();
  const res = await context.mongo.db.collection('profiles').findOne({ _id: model._id });
  ctx.is((res.firstName === firstName && res.lastName === lastName), true);
});

export default spec;
