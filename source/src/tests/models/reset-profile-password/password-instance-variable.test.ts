import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { ResetProfilePassword } from '../../../models/reset-profile-password';
import { closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);

spec.test('must be present', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePassword({}, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_PRESENT);
});

spec.test('must be between 8 and 24 characters', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePassword({}, { context });
  model.password = '1234567'; // 7 should fail
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_VALID);
  model.password = '1234567890123456789012345'; // 25 should fail
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['password']).getErrorCode(), ValidatorErrorCode.PROFILE_PASSWORD_NOT_VALID);
});

spec.test('sets password hash', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePassword({ password: 'foo' }, { context });
  ctx.true(!!model.passwordHash);
});

export default spec;
