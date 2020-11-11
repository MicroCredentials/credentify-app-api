import { Spec } from '@hayspec/spec';
import { ObjectId } from 'mongodb';
import { KeyPermissionKind } from '../../../config/permissions';
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

spec.test('removes key ability from key', async (ctx) => {
  const context = ctx.get('context');
  const community = await new Community({}, { context }).fake().create();

  const model = await new Key({}, { context }).populate({
    keyAbilities: [
      { _id: new ObjectId(), kind: KeyPermissionKind.READ_ASSET },
    ],
  }).create(community);

  await model.removeKeyAbility(community, model.keyAbilities[0].id);
  const testModel = await new Key({}, { context }).populateById(community, model.id);
  ctx.is(testModel.keyAbilities.length === 0, true);
});

export default spec;
