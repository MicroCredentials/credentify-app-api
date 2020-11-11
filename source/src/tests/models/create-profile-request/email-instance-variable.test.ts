import { Spec } from '@hayspec/spec';
import { ValidatorErrorCode } from '../../../config/types';
import { Context } from '../../../context';
import { CreateProfileRequest } from '../../../models/create-profile-request';
import { Profile } from '../../../models/profile';
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
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_PRESENT);
});

spec.test('must be valid email', async (ctx) => {
  const context = ctx.get('context');
  const model = new CreateProfileRequest({ email: 'foo' }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_NOT_VALID);
});

spec.test('must be unique', async (ctx) => {
  const context = ctx.get('context');
  const profile = await new Profile({}, { context }).fake().create();
  const model = new CreateProfileRequest({ email: profile.email }, { context });
  await model.validate({ quiet: true });
  ctx.true(model.getProp(['email']).getErrorCode(), ValidatorErrorCode.PROFILE_EMAIL_ALREADY_TAKEN);
});

export default spec;
