import { arrayInclusionValidator, presenceValidator } from '@rawmodel/validators';
import { ProfilePermissionKind } from '../config/permissions';
import { SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { integerParser } from '../lib/parsers';
import { ModelBase, prop } from './base';

/**
 * Profile ability model.
 */
export class ProfileAbility extends ModelBase {

  /**
   * Profile permission kind.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_ABILITIES_KIND_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          ProfilePermissionKind.AUTH,
          ProfilePermissionKind.DELETE,
          ProfilePermissionKind.RESET_PASSWORD,
          ProfilePermissionKind.RESET_EMAIL,
          ProfilePermissionKind.UPDATE,
          ProfilePermissionKind.CREATE_COMMUNITY,
          ProfilePermissionKind.CREATE_CREDENTIAL,
          ProfilePermissionKind.DELETE_CREDENTIAL,
          ProfilePermissionKind.FINALISE_CREDENTIAL,
          ProfilePermissionKind.MANAGE_REQUEST_CREDENTIAL,
          ProfilePermissionKind.READ_CREDENTIAL,
          ProfilePermissionKind.READ_ALL_CREDENTIALS,
          ProfilePermissionKind.REQUEST_CREDENTIAL,
        ]}),
        code: ValidatorErrorCode.PROFILE_ABILITIES_KIND_NOT_VALID,
      },
    ],
  })
  public kind: ProfilePermissionKind;

}
