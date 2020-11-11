import { emailValidator, presenceValidator, stringLengthValidator } from '@rawmodel/validators';
import axios from 'axios';
import * as bcrypt from 'bcryptjs';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateCreateProfileRequestToken } from '../lib/jwt';
import { stringParser } from '../lib/parsers';
import { ModelBase, prop } from './base';

/**
 * Signup request model.
 */
export class CreateProfileRequest extends ModelBase {
  /**
   * First name property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE],
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
    serializable: [SerializedStrategy.PROFILE],
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
   * Email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE],
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
      {
        resolver() { return this.validateEmailUniqueness(); },
        code: ValidatorErrorCode.PROFILE_EMAIL_ALREADY_TAKEN,
      },
    ],
    fakeValue: 'me@domain.com',
  })
  public email: string;

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
    populatable: [PopulateStrategy.PROFILE],
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
   * Returns `true` when `this.email` does not exist in the `profiles` collection.
   */
  public async validateEmailUniqueness() {
    return this.getContext().mongo.db.collection('profiles')
      .countDocuments({ 'email': this.email })
      .then((c) => c < 1);
  }

  /**
   * Sends an email message with a request token needed when creating new profile.
   */
  public async deliver() {
    return axios.post('https://api.sendgrid.com/v3/mail/send', {
      from: {
        email: 'hello@0xcert.org',
      },
      personalizations: [
        {
          to: [
            { email: this.email },
          ],
          dynamic_template_data: {
            'email': this.email,
            'requestToken': generateCreateProfileRequestToken(this.email, this.passwordHash, this.firstName, this.lastName, this.getContext()),
          },
        },
      ],
      template_id: 'd-d6b68a8feec04888a8299f47b5faf946',
      mail_settings: {
        // sandbox_mode: {
        //   enable: this.getContext().env.appEnv === 'development',
        // },
      },
    }, {
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.getContext().env.sendgridApiKey}`,
      },
    });
  }

}
