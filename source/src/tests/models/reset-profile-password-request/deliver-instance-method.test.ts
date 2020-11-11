import { Spec } from '@hayspec/spec';
import { Context } from '../../../context';
import { ResetProfilePasswordRequest } from '../../../models/reset-profile-password-request';
import { closeContextMongoHelper, createContextHelper } from '../../helpers/context';

const spec = new Spec<{
  context: Context;
}>();

spec.before(createContextHelper);
spec.after(closeContextMongoHelper);

spec.test('send email', async (ctx) => {
  const context = ctx.get('context');
  const model = new ResetProfilePasswordRequest({}, { context }).fake();
  await ctx.notThrows(() => model.deliver());
});

export default spec;
