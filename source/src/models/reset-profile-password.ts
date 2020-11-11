import { presenceValidator, stringLengthValidator } from '@rawmodel/validators';
import * as bcrypt from 'bcryptjs';
import { SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Profile password reset model.
 */
export class ResetProfilePassword extends ModelBase {
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
   * Password hash property definition.
   */
  @prop({
    serializable: [SerializedStrategy.DB],
  })
  public passwordHash: string;

  /**
   * Password property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    setter(v) {
      this.passwordHash = bcrypt.hashSync(v || '', bcrypt.genSaltSync(10));
      return v;
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_PASSWORD_NOT_PRESENT,
      },
      {
        resolver: stringLengthValidator({ minOrEqual: 8, maxOrEqual: 24 }),
        code: ValidatorErrorCode.PROFILE_PASSWORD_NOT_VALID,
      },
    ],
    fakeValue: 'notasecret',
  })
  public password: string;

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
