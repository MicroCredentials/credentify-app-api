import { arrayInclusionValidator, presenceValidator } from '@rawmodel/validators';
import { CommunityPermissionKind } from '../config/permissions';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { Profile } from './profile';

/**
 * Community ability model.
 */
export class CommunityAbility extends ModelBase {

  /**
   * Community ability ID property definition.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
    serializable: [SerializedStrategy.DB],
  })
  public _id: ObjectId;

  /**
   * Virtual community ability ID property definition.
   */
  @prop({
    parser: { resolver: bsonObjectIdStringParser() },
    serializable: [SerializedStrategy.PROFILE],
    getter() { return this._id ? this._id.toString() : this._id; },
    setter(v) { this._id = v; },
  })
  public id: string;

  /**
   * Community ID.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMUNITY_ABILITIES_COMMUNITY_NOT_PRESENT,
      },
    ],
    fakeValue: new ObjectId().toString(),
  })
  public communityId: string;

  /**
   * Community permission kind.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMUNITY_ABILITIES_KIND_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          CommunityPermissionKind.READ,
          CommunityPermissionKind.UPDATE,
          CommunityPermissionKind.DELETE,
          CommunityPermissionKind.READ_ABILITY,
          CommunityPermissionKind.CREATE_ABILITY,
          CommunityPermissionKind.DELETE_ABILITY,
          CommunityPermissionKind.CREATE_KEY,
          CommunityPermissionKind.DELETE_KEY,
          CommunityPermissionKind.READ_KEY,
          CommunityPermissionKind.CREATE_KEY_ABILITY,
          CommunityPermissionKind.DELETE_KEY_ABILITY,
          CommunityPermissionKind.CREATE_ACHIEVEMENT,
          CommunityPermissionKind.DELETE_ACHIEVEMENT,
          CommunityPermissionKind.UPDATE_ACHIEVEMENT,
          CommunityPermissionKind.READ_ACHIEVEMENT,
        ]}),
        code: ValidatorErrorCode.COMMUNITY_ABILITIES_KIND_NOT_VALID,
      },
    ],
    fakeValue: CommunityPermissionKind.READ,
  })
  public kind: CommunityPermissionKind;

  /**
   * Saves model in the database as a new document.
   */
  public async create(profile: Profile) {
    this._id = new ObjectId();
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
          _id: profile._id,
        },
        {
          $push: {
            communityAbilities: {
              ...this.serialize(SerializedStrategy.DB),
              _id: this._id,
            },
          },
        },
      );
    return this.commit();
  }

  /**
   * Deletes model in the database.
   */
  public async delete(profile: Profile) {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
          _id: profile._id,
        },
        {
          $pull: {
            communityAbilities: {
              _id: this._id,
            },
          },
        },
      );
    return this.commit();
  }
}
