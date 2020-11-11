import { ProfilePermissionKind } from '../config/permissions';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateAuthToken } from '../lib/jwt';
import { bsonObjectIdStringParser, stringParser, toObjectId } from '../lib/parsers';
import { presenceValidator } from '../lib/validators';
import { ModelBase, ObjectId, prop } from './base';
import { Profile } from './profile';

/**
 * Profile authentication model.
 */
export class AuthProfile extends ModelBase {

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
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_EMAIL_NOT_PRESENT,
      },
    ],
    fakeValue: 'me@domain.com',
  })
  public email: string;

  /**
   * Password property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_PASSWORD_NOT_PRESENT,
      },
    ],
    fakeValue: 'notasecret',
  })
  public password: string;

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
   * Verifies and populates the model or throws an error.
   */
  public async authenticate() {
    const profile = await new Profile(null, { context: this.getContext() }).populateByEmail(this.email);

    const isPeristant = profile && !profile._deletedAt;
    if (!isPeristant) {
      return this;
    }

    const hasAbility = !!profile.profileAbilities.find((a) => (
      a.kind === ProfilePermissionKind.AUTH
    ));
    if (!hasAbility) {
      return this;
    }

    const isPasswordValid = await profile.hasPassword(this.password);
    if (!isPasswordValid) {
      return this;
    }

    return this.populate(profile);
  }

}
