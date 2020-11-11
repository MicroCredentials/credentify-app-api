import * as env from '../config/env';
import { ProfilePermissionKind } from '../config/permissions';
import { Context } from '../context';
import { Mongo } from '../lib/mongo';
import { Profile } from '../models/profile';

/**
 * Seed logic.
 */
export async function perform(ctx: Mongo) {
  const context = new Context(env, ctx);
  await new Profile({}, { context }).fake().populate({
    profileAbilities: [
      { kind: ProfilePermissionKind.AUTH },
      { kind: ProfilePermissionKind.DELETE },
      { kind: ProfilePermissionKind.RESET_PASSWORD },
      { kind: ProfilePermissionKind.RESET_EMAIL },
      { kind: ProfilePermissionKind.UPDATE },
      { kind: ProfilePermissionKind.READ_CREDENTIAL },
      { kind: ProfilePermissionKind.CREATE_COMMUNITY },
      { kind: ProfilePermissionKind.CREATE_CREDENTIAL },
      { kind: ProfilePermissionKind.DELETE_CREDENTIAL },
      { kind: ProfilePermissionKind.READ_ALL_CREDENTIALS },
      { kind: ProfilePermissionKind.MANAGE_REQUEST_CREDENTIAL },
      { kind: ProfilePermissionKind.REQUEST_CREDENTIAL },
      { kind: ProfilePermissionKind.FINALISE_CREDENTIAL },
      { kind: ProfilePermissionKind.READ_USER },
    ],
    email: 'admin@0xcert.org',
  }).create();
}
