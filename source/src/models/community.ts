import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { bsonObjectIdStringParser, dateParser, stringParser, toNgrams, toObjectId,  } from '../lib/parsers';
import { presenceValidator } from '../lib/validators';
import { ModelBase, ObjectId, prop } from './base';
import { Key } from './key';

/**
 * Community model.
 */
export class Community extends ModelBase {
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
    serializable: [SerializedStrategy.DB, SerializedStrategy.SNAPSHOT],
  })
  public nameNgrams: string;

  /**
   * Name property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB, SerializedStrategy.SNAPSHOT],
    setter(v) {
      this.nameNgrams = toNgrams(v);
      return v;
    },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMUNITY_NAME_NOT_PRESENT,
      },
    ],
    fakeValue() { return 'communityName'; },
  })
  public name: string;

  /**
   * Description property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB, SerializedStrategy.SNAPSHOT],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMUNITY_DESCRIPTION_NOT_PRESENT,
      },
    ],
    fakeValue() { return 'communityDescription'; },
  })
  public description: string;

  /**
   * Keys property definition.
   */
  @prop({
    parser: { resolver: Key, array: true },
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    emptyValue: [],
    fakeValue() { return []; },
  })
  public keys: Key [];

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
  public isPersistent() {
    return this._id && !this._deletedAt;
  }

  /**
   * Marks document in the database as deleted.
   */
  public async markDeleted() {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne({
        '_id': this._id,
      }, {
        $set: { '_deletedAt': this._deletedAt = new Date() },
      });
    return this.commit();
  }

  /**
   * Saves model in the database as a new document.
   */
  public async create() {
    await this.getContext().mongo.db
      .collection('communities')
      .insertOne(
        this.serialize(SerializedStrategy.DB),
      ).then((r) => (
        this._id = r.insertedId
      ));
    return this.commit();
  }

  /**
   * Populates model fields by loading the document with the provided id from the database.
   * @param communityId Community ID.
   */
  public async populateById(communityId: any) {
    communityId = toObjectId(communityId);
    if (!communityId) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('communities')
      .findOne({
        '_id': new ObjectId(communityId),
      });

    return this.reset().populate(doc).commit();
  }

  /**
   * Removes community abilities from all users for `this` community.
   */
  public async removePermissionsFromAllProfiles() {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateMany({},
        {
          $pull: {
            communityAbilities: { communityId: this._id.toString() },
          },
        },
      );
  }

  /**
   * Updates model data in the database.
   */
  public async update() {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne({
        '_id': this._id,
      }, {
        $set: {
          name: this.name,
          nameNgrams: this.nameNgrams,
          description: this.description,
        },
      });
    return this.commit();
  }

  // TODO: Move to separate model.
  /**
   * Tells if addon exists on model in db.
   * @param addonId Addon ID.
   */
  public async addonExists(addonId: string) {
    return this.getContext().mongo.db
      .collection('communities')
      .countDocuments({
        _id: this._id,
        'addons._id': new ObjectId(addonId),
      })
      .then((c) => c === 1);
  }

  // TODO: Move to separate model.
  /**
   * Removes addon from community.
   * @param addonId Addon ID.
   */
  public async removeAddon(addonId: string) {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne({ _id: this._id },
        {
          $pull: {
            addons: { _id: new ObjectId(addonId) },
          },
        },
      );
    return this.commit();
  }
}
