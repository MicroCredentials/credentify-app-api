import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { Profile } from '../../../models/profile';
import { ResetProfileEmailRequest } from '../../../models/reset-profile-email-request';
import { cleenupContextMongoHelper, closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);
spec.afterEach(cleenupContextMongoHelper);

spec.test('must be present', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfileEmailRequest({}, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['newEmail']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_PRESENT);
});

spec.test('must be valid email', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfileEmailRequest({ newEmail: 'foo' }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['newEmail']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_VALID);
});

spec.test('must be unique', async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().create();
  const model = new ResetProfileEmailRequest({ newEmail: profile.email }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['newEmail']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_ALREADY_TAKEN);
});

export default spec;
