import { mongoUniquenessHandler } from '@rawmodel/handlers';
import { emailValidator, presenceValidator } from '@rawmodel/validators';
import * as bcrypt from 'bcryptjs';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, dateParser, stringParser, toNgrams, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { CommunityAbility } from './community-ability';
import { ProfileAbility } from './profile-ability';
import { ProfilePayment } from './profile-payment';
import { Wallet } from './wallet';

/**
 * Signup model.
 */
export class Profile extends ModelBase {

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

  /**
   * First name property definition.
   */
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
   * Deleted at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.DB],
  })
  public _deletedAt: Date;

  /**
   * Email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      return v ? v.toLowerCase().replace(' ', '') : v;
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
    fakeValue() { return `${new ObjectId()}@domain.com`; },
  })
  public email: string;

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
    fakeValue: bcrypt.hashSync('notasecret', bcrypt.genSaltSync(10)),
  })
  public passwordHash: string;

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
   * Community abilities property definition.
   */
  @prop({
    parser: { resolver: CommunityAbility, array: true },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    emptyValue: [],
  })
  public communityAbilities: CommunityAbility[];

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
   * Profile abilities property definition.
   */
  @prop({
    parser: { resolver: Wallet },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    fakeValue() { return new Wallet().fake(); },
  })
  public wallet: Wallet;

  /**
   * Tells if the model represents a document stored in the database.
   */
  public isPersistant() {
    return this._id && !this._deletedAt;
  }

  /**
   * Tells if the provided password is valid.
   * @param password User password.
   */
  public async hasPassword(password: string) {
    return (
      typeof password === 'string'
      && password.length > 0
      && await bcrypt.compare(password, this.passwordHash)
    );
  }

  /**
   * Populates model fields by loading the document with the provided id from the database.
   * @param profileId Profile ID.
   */
  public async populateById(profileId: any) {
    profileId = toObjectId(profileId);
    if (!profileId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('profiles')
      .findOne({
        '_id': new ObjectId(profileId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Populates model fields by loading the document with the provided community ability id from the database.
   * @param communityAbilityId Community ability ID.
   */
  public async populateByCommunityAbilityId(communityAbilityId: any) {
    communityAbilityId = toObjectId(communityAbilityId);
    if (!communityAbilityId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('profiles')
      .findOne({
        'communityAbilities._id': new ObjectId(communityAbilityId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Populates model fields by loading the document with the provided email from the database.
   * @param email Profile email.
   */
  public async populateByEmail(email) {
    if (!email) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('profiles')
      .findOne({
        'email': email,
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Saves model data in the database as a new document.
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

  /**
   * Updates model data in the database.
   */
  public async update() {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
        '_id': this._id,
      }, {
        $set: {
          firstName: this.firstName,
          lastName: this.lastName,
        },
      });
    return this.commit();
  }

  /**
   * Marks document in the database as deleted.
   */
  public async markDeleted() {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
        '_id': this._id,
      }, {
        $set: { '_deletedAt': this._deletedAt = new Date() },
      });
    return this.commit();
  }

}
