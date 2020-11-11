import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { ResetProfilePasswordRequest } from '../../../models/reset-profile-password-request';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('must be present', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePasswordRequest({}, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_PRESENT);
});

spec.test('must be valid email', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePasswordRequest({ email: 'foo' }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_VALID);
});

spec.test('must exist', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePasswordRequest({ email: 'test@email.com' }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_DOES_NOT_EXIST);
});

export default spec;
