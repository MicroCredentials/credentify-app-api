import { presenceValidator } from '@rawmodel/validators';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { booleanParser, bsonObjectIdStringParser, dateParser, stringParser, toNgrams, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
/**
 * Signup model.
 */
export class Achievement extends ModelBase {

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
   * Name ngrams property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB],
  })
  public nameNgrams: string;

  /**
   * Name property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      this.nameNgrams = toNgrams(v);
      return v;
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.ACHIEVEMENT_NAME_NOT_PRESENT,
      },
    ],
    fakeValue() { return 'name'; },
  })
  public name: string;

  /**
   * Tag property definition.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    setter(v) { return v === null ? null : v.map((tag) => tag.toLowerCase()); },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.ACHIEVEMENT_TAG_NOT_PRESENT,
      },
    ],
    emptyValue: [],
    fakeValue: ['course'],
  })
  public tag: string[];

  /**
   * CourseId property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.ACHIEVEMENT_COURSE_ID_NOT_PRESENT,
      },
    ],
    fakeValue: new ObjectId().toString(),
  })
  public communityId: string;

  /**
   * Dependent achievements.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    validators: [
      {
        resolver() { return this.validateDependants(); },
        code: ValidatorErrorCode.ACHIEVEMENT_DEPENDANTS_NOT_VALID,
      },
    ],
    emptyValue: [],
  })
  public dependentAchievementIds: string[];

  /**
   * refLanguage property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'ISO 639-1 code of the qualification language',
  })
  public refLanguage: string;

  /**
   * altLabel property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Alternative name of the qualification',
  })
  public altLabel: string;

  /**
   * definition property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Short description of the qualification',
  })
  public definition: string;

  /**
   * learningOutcomeDesc property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Full learning outcome description of the qualification',
  })
  public learningOutcomeDesc: string;

  /**
   * field property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Field of Education and Training Code (ISCED FoET 2013)',
  })
  public field: string;

  /**
   * eqfLevel property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'European Qualification Framework level',
  })
  public eqfLevel: string;

  /**
   * nqfLevel property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'National/Regional Qualification Framework level',
  })
  public nqfLevel: string;

  /**
   * creditSystem property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Name of the Credit system in use (e.g. ECTS)',
  })
  public creditSystem: string;

  /**
   * creditSysTitle property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Exact and official title of the Credit system',
  })
  public creditSysTitle: string;

  /**
   * creditSysDef property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Short and abstract description of the Credit system',
  })
  public creditSysDef: string;

  /**
   * creditSysValue property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Value described in terms of hours/certificates/accompl.',
  })
  public creditSysValue: string;

  /**
   * creditSysIssuer property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Which organization/consortium/law regulates who can issue this token',
  })
  public creditSysIssuer: string;

  /**
   * canConsistOf property definition.
   */
  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: [new ObjectId().toString()],
    defaultValue: [],
  })
  public canConsistOfIds: string[];

  /**
   * creditSysRefNum property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Credit system reference number',
  })
  public creditSysRefNum: string;

  /**
   * numCreditPoints property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Number of credit points assigned to the qualification following this system',
  })
  public numCreditPoints: string;

  /**
   * ECTSCreditPoints property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Number of credit points assigned to the qualification following ECTS system',
  })
  public ectsCreditPoints: string;

  /**
   * volumeOfLearning property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'How many hours of learning are needed (notional learning hours)',
  })
  public volumeOfLearning: string;

  /**
   * isPartialQual property definition.
   */
  @prop({
    parser: { resolver: booleanParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: false,
  })
  public isPartialQual: boolean;

  /**
   * waysToAcquire property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Whether the qualification can be acquired by validation of a formal/non-formal and/or informal learning processes',
  })
  public waysToAcquire: string;

  /**
   * eduCredType property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Full name of the qualification type or credit system in use',
  })
  public eduCredType: string;

  /**
   * entryReq property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Entry requirement of the qualification',
  })
  public entryReq: string;

  /**
   * learningOutcome property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Expresses a learning outcome of the qualification as a relation to a skill, competence or knowledge from a known framework or standard classification',
  })
  public learningOutcome: string;

  /**
   * relatedOccupation property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Relates the qualification to an occupation or occupational field from a known framework or standard classification',
  })
  public relatedOccupation: string;

  /**
   * recognition property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Information related to the formal recognition of a qualification',
  })
  public recognition: string;

  /**
   * awardingActivity property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Activity related to the awarding of the qualification',
  })
  public awardingActivity: string;

  /**
   * awardingMethod property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Whether the qualification is certified through undergoing the learning activity or an assessment of acquired competence',
  })
  public awardingMethod: string;

  /**
   * gradeScheme property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Description of the grading scheme and what the grade means',
  })
  public gradeScheme: string;

  /**
   * modeOfStudy property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Online, face to face, practice, workplace, informal learning',
  })
  public modeOfStudy: string;

  /**
   * publicKey property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Public Key the institution uses to identify itself and authenticate the credentials',
  })
  public publicKey: string;

  /**
   * assesmentMethod property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Description of the form of assessment',
  })
  public assesmentMethod: string;

  /**
   * accreditation property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Information related to the accreditation, quality assurance and regulation of a qualification',
  })
  public accreditation: string;

  /**
   * homePage property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'The homepage (a public web document) of a qualification',
  })
  public homePage: string;

  /**
   * landingPage property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'A web page that can be navigated to in a web browser to gain access to the qualification and/or additional information',
  })
  public landingPage: string;

  /**
   * supplDoc property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'A public web document containing additional documentation about the qualification, such as a diploma or certificate supplement',
  })
  public supplDoc: string;

  /**
   * historyNote property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'A property to record information about major lifecycle changes of the qualification (e.g. past state/use/meaning of a qualification)',
  })
  public historyNote: string;

  /**
   * additionalNote property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'A property to record any further information about a qualification',
  })
  public additionalNote: string;

  /**
   * status property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'The publication status of a qualification, e.g. released, obsolete, ...',
  })
  public status: string;

  /**
   * replaces property definition.
   * A related qualification that was replaced, displaced or superseded by this qualification.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return new ObjectId().toString(); },
  })
  public replacesId: string;

  /**
   * replacedBy property definition.
   * The qualification that replaces, displaces or supersedes this qualification.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue() { return new ObjectId().toString(); },
  })
  public replacedById: string;

  /**
   * owner property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'The organization owning rights over the qualification, e.g. an awarding body, a national or regional authority, etc.',
  })
  public owner: string;

  /**
   * creator property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: 'Organisation primarily responsible for establishing, defining and managing the qualification and its curricula',
  })
  public creator: string;

  /**
   * publisher property definition.
   * profileId of the creator.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: new ObjectId().toString(),
  })
  public publisherId: string;

  /**
   * Updated at property definition.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
  })
  public _updatedAt: Date;

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
   * Tells if the model represents a document stored in the database.
   */
  public isPersistant() {
    return this._id && !this._deletedAt;
  }

  /**
   * Populates model fields by loading the document with the provided id from the database.
   * @param achievementId Achievement ID.
   */
  public async populateById(achievementId: any) {
    achievementId = toObjectId(achievementId);
    if (!achievementId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('achievements')
      .findOne({
        '_id': new ObjectId(achievementId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Saves model data in the database as a new document.
   */
  public async create() {
    await this.getContext().mongo.db
      .collection('achievements')
      .insertOne({
        ...this.serialize(SerializedStrategy.DB),
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
      .collection('achievements')
      .updateOne({
        '_id': this._id,
      }, {
        $set: {
          ...this.serialize(SerializedStrategy.DB),
          '_updatedAt': this._updatedAt = new Date(),
        },
      });
    return this.commit();
  }

  /**
   * Marks document in the database as deleted.
   */
  public async markDeleted() {
    await this.getContext().mongo.db
      .collection('achievements')
      .updateOne({
        '_id': this._id,
      }, {
        $set: { '_deletedAt': this._deletedAt = new Date() },
      });
    return this.commit();
  }

  /**
   * Checks if dependentAchievementIds are valid.
   */
  public async validateDependants() {
    const context = this.getContext();
    if (typeof this.dependentAchievementIds !== 'undefined') {
      for (const id of this.dependentAchievementIds) {
        const a = await new Achievement({}, { context }).populateById(id);
        if (!a.isPersistant()) {
          return false;
        }
        if (this._id !== null && a._id.toString() === this._id.toString()) {
          return false;
        }
      }
    }
    return true;
  }

}
