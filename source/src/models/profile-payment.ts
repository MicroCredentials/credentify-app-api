import { arrayInclusionValidator, presenceValidator } from '@rawmodel/validators';
import { PaymentKind } from '../config/types';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { Profile } from './profile';

/**
 * Profile payment model.
 */
export class ProfilePayment extends ModelBase {

  /**
   * Database ID.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
    serializable: [SerializedStrategy.DB],
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
   * Payment kind.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_ABILITIES_KIND_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          PaymentKind.CREDIT_CARD,
        ]}),
        code: ValidatorErrorCode.PROFILE_PAYMENT_KIND_INVALID,
      },
    ],
    fakeValue: PaymentKind.CREDIT_CARD,
  })
  public kind: PaymentKind;

  /**
   * Payment reference.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_PAYMENT_REFERENCE_NOT_PRESENT,
      },
    ],
    fakeValue: new ObjectId(),
  })
  public reference: string;

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
            profilePayments: {
              ...this.serialize(SerializedStrategy.DB),
              _id: this._id,
            },
          },
        },
      );
    return this.commit();
  }

  /**
   * Deletes document in the database.
   */
  public async delete(profile: Profile) {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
          _id: profile._id,
        },
        {
          $pull: {
            profilePayments: {
              _id: this._id,
            },
          },
        },
      );
    return this.commit();
  }
}
