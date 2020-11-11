import { arrayInclusionValidator, presenceValidator } from '@rawmodel/validators';
import { KeyPermissionKind } from '../config/permissions';
import { SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, integerParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Key ability model.
 */
export class KeyAbility extends ModelBase {
  /**
   * ID property definition.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
    serializable: [SerializedStrategy.DB],
    fakeValue() { return new ObjectId(); },
  })
  public _id: ObjectId;

  /**
   * ID property definition.
   */
  @prop({
    parser: { resolver: bsonObjectIdStringParser() },
    serializable: [SerializedStrategy.PROFILE],
    getter() { return this._id ? this._id.toString() : this._id; },
    setter(v) { this._id = v; },
  })
  public id: string;

  /**
   * Key permission kind.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.KEY_ABILITIES_KIND_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          KeyPermissionKind.READ_ASSET,
          KeyPermissionKind.CREATE_ASSET,
          KeyPermissionKind.UPDATE_ASSET,
          KeyPermissionKind.DELETE_ASSET,
        ]}),
        code: ValidatorErrorCode.KEY_ABILITIES_KIND_NOT_VALID,
      },
    ],
  })
  public kind: KeyPermissionKind;
}
