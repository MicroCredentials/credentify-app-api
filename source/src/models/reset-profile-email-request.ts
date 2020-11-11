import { emailValidator, presenceValidator } from '@rawmodel/validators';
import axios from 'axios';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateResetProfileEmailRequestToken } from '../lib/jwt';
import { stringParser } from '../lib/parsers';
import { ModelBase, prop } from './base';

/**
 * Reset profile email request model.
 */
export class ResetProfileEmailRequest extends ModelBase {
  /**
   * Email (new) property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE],
    setter(v) {
      return (v || '').toLowerCase().replace(' ', '');
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
    fakeValue: 'meNew@domain.com',
  })
  public newEmail: string;

  /**
   * Profile email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    setter(v) {
      return (v || '').toLowerCase().replace(' ', '');
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
        resolver() { return this.validateEmailExistence(); },
        code: ValidatorErrorCode.PROFILE_EMAIL_DOES_NOT_EXIST,
      },
    ],
    fakeValue: 'me@domain.com',
  })
  public currentEmail: string;

  /**
   * Returns `true` when `this.newEmail` does not exist in the `profiles` collection.
   */
  public async validateEmailUniqueness() {
    return this.getContext().mongo.db.collection('profiles')
      .countDocuments({ 'email': this.newEmail })
      .then((c) => c < 1);
  }

  /**
   * Returns `true` when `this.currentEmail` exists and is unique in the `profiles` collection.
   */
  public async validateEmailExistence() {
    return this.getContext().mongo.db.collection('profiles')
      .countDocuments({ 'email': this.currentEmail })
      .then((c) => c === 1);
  }

  /**
   * Sends an email message with a request token needed when resetting profile's email.
   */
  public async deliver() {
    return axios.post('https://api.sendgrid.com/v3/mail/send', {
      from: {
        email: 'hello@0xcert.org',
      },
      personalizations: [
        {
          to: [
            { email: this.currentEmail },
          ],
          dynamic_template_data: {
            'email': this.currentEmail,
            'requestToken': generateResetProfileEmailRequestToken(this.newEmail, this.getContext()),
          },
        },
      ],
      template_id: 'd-94acc97380a94997ad5b2e32ba970f7e',
      mail_settings: {
        sandbox_mode: {
          enable: this.getContext().env.appEnv === 'development',
        },
      },
    }, {
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${this.getContext().env.sendgridApiKey}`,
      },
    });
  }

}
