import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { CreateProfileRequest } from '../../../models/create-profile-request';
import { closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);

spec.test('instance variable `password` must be present', async (ctx) => {
  const context = ctx.get('context');
  const model = new CreateProfileRequest({}, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_PRESENT);
});

spec.test('instance variable `password` must be between 8 and 24 characters', async (ctx) => {
  const context = ctx.get('context');
  const model = new CreateProfileRequest({}, { context });
  model.password = '1234567'; // 7 should fail
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_VALID);
  model.password = '1234567890123456789012345'; // 25 should fail
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_VALID);
});

spec.test('instance variable `password` sets password hash instance variable', async (ctx) => {
  const context = ctx.get('context');
  const model = new CreateProfileRequest({ password: 'foo' }, { context });
  ctx.true(!!model.passwordHash);
});

export default spec;
