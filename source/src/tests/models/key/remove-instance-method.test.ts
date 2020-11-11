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

spec.test('deletes model from database', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const model = new Key({}, { context });
  await model.create(community);
  ctx.is(await model.doesExist(community, model.id), true);
  await model.remove(community);
  ctx.is(await model.doesExist(community, model.id), false);
});

export default spec;
