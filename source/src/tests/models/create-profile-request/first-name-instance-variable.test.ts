import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { CreateProfileRequest } from '../../../models/create-profile-request';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('must be present', async (ctx) => {
  const context = ctx.get('context');
  const model = new CreateProfileRequest({}, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['firstName']).getErrorCode, ValidatorErrorCode.PROFILE_FIRST_NAME_NOT_PRESENT);
});

export default spec;
