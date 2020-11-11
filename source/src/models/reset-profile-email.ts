import { mongoUniquenessHandler } from '@rawmodel/handlers';
import { emailValidator, presenceValidator } from '@rawmodel/validators';
import { SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Profile email reset model.
 */
export class ResetProfileEmail extends ModelBase {
  /**
   * Database ID.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
  })
  public _id: ObjectId;

  /**
   * Virtual ID.
   */
  @prop({
    parser: { resolver: bsonObjectIdStringParser() },
    serializable: [SerializedStrategy.PROFILE],
    getter() { return this._id ? this._id.toString() : this._id; },
    setter(v) { this._id = v; },
  })
  public id: string;

  /**
   * Email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      return (v || '').toLowerCase().replace(' ', '');
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_EMAIL_NOT_PRESENT,
      },
      {
        resolver: emailValidator(),
        code: ValidatorErrorCode.PROFILE_EMAIL_NOT_VALID,
      },
    ],
    handlers: [
      {
        resolver: mongoUniquenessHandler({ indexName: 'uniqueEmail' }),
        code: ValidatorErrorCode.PROFILE_EMAIL_ALREADY_TAKEN,
      },
    ],
    fakeValue: 'meNew@domain.com',
  })
  public email: string;

  /**
   * Updates model data in the database.
   */
  public async update() {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
        '_id': this._id,
      }, {
        $set: this.serialize(SerializedStrategy.DB),
      });
    return this.commit();
  }

}
