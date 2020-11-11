import { arrayInclusionValidator, presenceValidator } from '@rawmodel/validators';
import { CredentialStage, PopulateStrategy, SerializedStrategy, ValidatorErrorCode  } from '../config/types';
import { bsonObjectIdStringParser, dateParser, integerParser, stringParser, toObjectId } from '../lib/parsers';
import { Achievement } from './achievement';
import { ModelBase, ObjectId, prop } from './base';
import { Community } from './community';

/**
 * Credential model.
 */
export class Credential extends ModelBase {

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
   * Achievement property definition.
   */
  @prop({
    parser: { resolver: Achievement },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREDENTIAL_ACHIEVEMENT_NOT_PRESENT,
      },
      {
        resolver() { return this.validateDependants(); },
        code: ValidatorErrorCode.CREDENTIAL_CONDITIONS_NOT_MET,
      },
    ],
    fakeValue: new Achievement().fake(),
  })
  public achievement: Achievement;

  /**
   * Community property definition.
   */
  @prop({
    parser: { resolver: Community },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREDENTIAL_COMMUNITY_NOT_PRESENT,
      },
    ],
    fakeValue: new Community().fake(),
  })
  public community: Community;

  /**
   * ProfileId property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREDENTIAL_PROFILE_ID_NOT_PRESENT,
      },
    ],
    fakeValue: new ObjectId().toString(),
  })
  public profileId: string;

  /**
   * Stage property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREDENTIAL_STAGE_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          CredentialStage.REQUEST,
          CredentialStage.REJECTED,
          CredentialStage.FAILED,
          CredentialStage.CANCELED,
          CredentialStage.PENDING,
          CredentialStage.COMPLETED,
        ]}),
        code: ValidatorErrorCode.CREDENTIAL_STAGE_NOT_VALID,
      },
    ],
    fakeValue: CredentialStage.PENDING,
  })
  public stage: CredentialStage;

  /**
   * Note property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'note',
  })
  public note: string;

  /**
   * grade property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Grade achieved',
  })
  public grade: string;

  /**
   * awardingBodyId property definition.
   * Profile id of the approver.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return new ObjectId().toString(); },
  })
  public awardingBodyId: string;

  /**
   * creditsAwarded property definition.
   * Number of credits awarded.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 6,
  })
  public creditsAwarded: number;

  /**
   * expiryPeriod property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: new Date(),
  })
  public expiryPeriod: Date;

  /**
   * cheating property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Methods for cheating prevention',
  })
  public cheating: string;

  /**
   * Wallet property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: '0xB257f4eF17c81Eb4d15A741A8D09e1EBb3953201',
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREDENTIAL_WALLET_NOT_PRESENT,
      },
    ],
  })
  public wallet: string;

  /**
   * Actions order id.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return new ObjectId(); },
  })
  public actionsOrderId: ObjectId;

  /**
   * Meta data property definition.
   */
  @prop({
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return {}; },
  })
  public metadata: any;

  /**
   * Meta data property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.DB],
    fakeValue() { return {}; },
  })
  public evidence: string;

  /**
   * Transaction hash property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return '0x0...'; },
  })
  public txHash: string;

  /**
   * Created at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
  })
  public _createdAt: Date;

  /**
   * Updated at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.DB],
  })
  public _updatedAt: Date;

  /**
   * Deleted at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.DB],
  })
  public _deletedAt: Date;

  /**
   * Tells if the model represents a document stored in the database.
   */
  public isPersistant() {
    return this._id && !this._deletedAt;
  }

  /**
   * Populates model fields by loading the document with the provided id from the database.
   * @param credentialId Credential ID.
   */
  public async populateById(credentialId: any) {
    credentialId = toObjectId(credentialId);
    if (!credentialId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('credentials')
      .findOne({
        '_id': new ObjectId(credentialId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Populates model fields by loading the document with the provided actions order id from the database.
   * @param actionsOrderId Actions order ID.
   */
  public async populateByActionsOrderId(actionsOrderId: any) {
    actionsOrderId = toObjectId(actionsOrderId);
    if (!actionsOrderId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('credentials')
      .findOne({
        'actionsOrderId': new ObjectId(actionsOrderId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Saves model data in the database as a new document.
   */
  public async create() {
    await this.getContext().mongo.db
      .collection('credentials')
      .insertOne({
        ...this.serialize(SerializedStrategy.DB),
        achievement: {
          ...this.achievement.serialize(SerializedStrategy.DB),
          _id: this.achievement._id,
        },
        community: {
          ...this.community.serialize(SerializedStrategy.SNAPSHOT),
          _id: this.community._id,
        },
        _createdAt: this._createdAt = new Date(),
      }).then((r) => (
        this._id = r.insertedId
      ));
    return this.commit();
  }

  /**
   * Updates model data in the database.
   */
  public async update() {
    await this.getContext().mongo.db
      .collection('credentials')
      .updateOne({
        '_id': this._id,
      }, {
        $set: {
          stage: this.stage,
          awardingBodyId: this.awardingBodyId,
          note: this.note,
          _updatedAt: this._updatedAt = new Date(),
          grade: this.grade,
          creditsAwarded: this.creditsAwarded,
          expiryPeriod: this.expiryPeriod,
          cheating: this.cheating,
          actionsOrderId: this.actionsOrderId,
          metadata: this.metadata,
          txHash: this.txHash,
          evidence: this.evidence,
        },
      });
    return this.commit();
  }

  /**
   * Marks document in the database as deleted.
   */
  public async markDeleted() {
    await this.getContext().mongo.db
      .collection('credentials')
      .updateOne({
        '_id': this._id,
      }, {
        $set: { '_deletedAt': this._deletedAt = new Date() },
      });
    return this.commit();
  }

  /**
   * Checks if Credential dependents are completed.
   */
  public async validateDependants() {
    const context = this.getContext();
    if (typeof this.achievement.dependentAchievementIds !== 'undefined') {
      const completedCredentials = await context.mongo.db
        .collection('credentials')
        .countDocuments({
          profileId: this.profileId,
          'achievement._id': { $in: this.achievement.dependentAchievementIds.map((id) => toObjectId(id)) },
          stage: CredentialStage.COMPLETED,
        });

      if (completedCredentials !== this.achievement.dependentAchievementIds.length) {
        return false;
      }
    }
    return true;
  }

}
