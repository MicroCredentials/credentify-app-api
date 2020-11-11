import { mongoUniquenessHandler } from '@rawmodel/handlers';
import { emailValidator, presenceValidator } from '@rawmodel/validators';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateAuthToken } from '../lib/jwt';
import { bsonObjectIdStringParser, dateParser, stringParser, toNgrams, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { ProfileAbility } from './profile-ability';
import { ProfilePayment } from './profile-payment';

/**
 * Signup model.
 */
export class CreateProfile extends ModelBase {

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
   * First name ngrams property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB],
  })
  public firstNameNgrams: string;

  /**
   * Last name ngrams property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB],
  })
  public lastNameNgrams: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      this.firstNameNgrams = toNgrams(v);
      return v;
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_FIRST_NAME_NOT_PRESENT,
      },
    ],
    fakeValue() { return 'firstName'; },
  })
  public firstName: string;

  /**
   * First name property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      this.lastNameNgrams = toNgrams(v);
      return v;
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_LAST_NAME_NOT_PRESENT,
      },
    ],
    fakeValue() { return 'lastName'; },
  })
  public lastName: string;

  /**
   * Created at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
  })
  public _createdAt: Date;

  /**
   * Password hash property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_PASSWORD_NOT_PRESENT,
      },
    ],
  })
  public passwordHash: string;

  /**
   * Email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      return v.toLowerCase().replace(' ', '');
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
    fakeValue: 'me@domain.com',
  })
  public email: string;

  /**
   * Profile abilities property definition.
   */
  @prop({
    parser: { resolver: ProfileAbility, array: true },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    emptyValue: [],
  })
  public profileAbilities: ProfileAbility[];

  /**
   * Authentication token property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    getter() {
      return generateAuthToken(this.id, this.getContext());
    },
    serializable: [SerializedStrategy.PROFILE],
  })
  public authToken: string;

  /**
   * Profile payments property definition.
   */
  @prop({
    parser: { resolver: ProfilePayment, array: true },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    emptyValue: [],
  })
  public profilePayments: ProfilePayment[];

  /**
   * Saves model in the database as a new document.
   */
  public async create() {
    await this.getContext().mongo.db
      .collection('profiles')
      .insertOne(
        this.serialize(SerializedStrategy.DB),
      ).then((r) => (
        this._id = r.insertedId
      ));
    return this.commit();
  }

}
