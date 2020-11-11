import { Spec } from '@hayspec/spec';
import { ObjectId } from 'mongodb';
import { KeyPermissionKind } from '../../../config/permissions';
import { Context } from '../../../context';
import { Community } from '../../../models/community';
import { Key } from '../../../models/key';
import { KeyAbility } from '../../../models/key-ability';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('add key ability to key', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();
  const keyAbility = new KeyAbility({}, { context }).populate({
    _id: new ObjectId(),
    kind: KeyPermissionKind.READ_ASSET,
  });

  const model = await new Key({}, { context }).populate({}).create(community);
  await model.addKeyAbility(community,  keyAbility);
  const testModel = await new Key({}, { context }).populateById(community, model.id);
  ctx.is(testModel.keyAbilities.length === 1, true);
});

export default spec;
