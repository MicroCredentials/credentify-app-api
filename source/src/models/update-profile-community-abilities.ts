import { SerializedStrategy } from '../config/types';
import { toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { CommunityAbility } from './community-ability';

/**
 * Update community abilities model.
 */
export class UpdateProfileCommunityAbilities extends ModelBase {

  /**
   * Profile ID.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
  })
  public profileId: ObjectId;

  /**
   * Community abilities property definition.
   */
  @prop({
    parser: { resolver: CommunityAbility, array: true },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    emptyValue: [],
  })
  public communityAbilities: CommunityAbility[];

  /**
   * Updates model data in the database.
   */
  public async update() {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
        '_id': this.profileId,
      }, {
        $set: {
          communityAbilities: this.communityAbilities.map((a) => {
            return {
              _id: a._id === null ? new ObjectId() : a._id,
              kind: a.kind,
              communityId: a.communityId,
            };
          }),
        },
      });
    return this.commit();
  }
}
