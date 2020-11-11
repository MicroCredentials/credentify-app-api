import * as bcrypt from 'bcryptjs';
import { SerializedStrategy } from '../config/types';
import { generateCommunityKeyValue } from '../lib/generators';
import { bsonObjectIdStringParser, integerParser, stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';
import { Community } from './community';
import { KeyAbility } from './key-ability';

/**
 * Key model.
 */
export class Key extends ModelBase {

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
   * Key value property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.PROFILE],
    fakeValue: bcrypt.hashSync(new ObjectId().toString(), bcrypt.genSaltSync(10)),
  })
  public key: string;

  /**
   * Time to live property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.PROFILE],
    emptyValue: null,
  })
  public ttl: number;

  /**
   * Key abilities property definition.
   */
  @prop({
    parser: { resolver: KeyAbility, array: true },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    emptyValue: [],
  })
  public keyAbilities: KeyAbility[];

  /**
   * Creates new model dependent on community model.
   */
  public async create(community: Community) {
    this._id = new ObjectId();
    this.key = await generateCommunityKeyValue();
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne(
        { _id: community._id },
        {
          $push: {
            keys: {
              _id: this._id,
              key: this.key,
              ttl: this.ttl,
              keyAbilities: this.keyAbilities.map((a) => {
                return { _id: a._id, kind: a.kind };
              }),
            },
          },
        });
    return this.commit();
  }

  /**
   * Tells if model exist in db.
   * @param community Community model instance.
   */
  public async doesExist(community: Community, keyId: string) {
    return this.getContext().mongo.db
      .collection('communities')
      .countDocuments({
        _id: new ObjectId(community._id),
        'keys._id': new ObjectId(keyId),
      })
      .then((c) => c === 1);
  }

  /**
   * Populates model fields by loading the document with the provided id from the database.
   * @param keyId Key ID.
   */
  public async populateById(community: Community, keyId: any) {
    keyId = toObjectId(keyId);
    if (!keyId || !community._id) {
      return this.reset();
    }

    const doc = await this.getContext().mongo.db
      .collection('communities')
      .findOne({
        _id: new ObjectId(community._id),
      }, {
        projection: {
          keys: {
            $elemMatch: { _id: new ObjectId(keyId) },
          },
        },
      });
    const key = doc.keys && doc.keys[0] ? doc.keys[0] : null;
    return this.reset().populate(key).commit();
  }

  /**
   * Tells if the model represents a document stored in the database.
   */
  public isPersistent() {
    return !!this._id;
  }

  /**
   * Removes `this` key from community.
   * @param community Community model instance.
   */
  public async remove(community: Community) {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne({ _id: new ObjectId(community._id) },
        {
          $pull: {
            keys: { _id: this._id },
          },
        },
      );
    return this.commit();
  }

  /**
   * Removes key ability from key.
   */
  public async removeKeyAbility(community: Community, abilityId: string) {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne(
        {
          _id: new ObjectId(community._id),
          'keys._id': this._id,
        },
        {
          $pull: {
            'keys.$.keyAbilities': { '_id': new ObjectId(abilityId) },
          },
        },
      );
    this.keyAbilities = this.keyAbilities.filter((a) => a._id.toString() !== abilityId);
    return this.commit();
  }

  /**
   * Add key ability to key.
   */
  public async addKeyAbility(community: Community, keyAbility: KeyAbility) {
    await this.getContext().mongo.db
      .collection('communities')
      .updateOne(
        {
          _id: new ObjectId(community._id),
          'keys._id': this._id,
        },
        {
          $push: {
            'keys.$.keyAbilities': { _id: keyAbility._id, kind: keyAbility.kind },
          },
        },
      );
    return this.commit();
  }
}
