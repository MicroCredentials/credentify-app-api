import { emailValidator, presenceValidator, stringLengthValidator } from '@rawmodel/validators';
import axios from 'axios';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateResetProfilePasswordRequestToken } from '../lib/jwt';
import { stringParser } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Reset profile password request model.
 */
export class ResetProfilePasswordRequest extends ModelBase {
  /**
   * Email property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    setter(v) {
      return v ? (v || '').toLowerCase().replace(' ', '') : v;
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
    fakeValue() { return `${new ObjectId()}@domain.com`; },
  })
  public email: string;

  /**
   * Returns `true` when `this.email` exists and is unique in the `profiles` collection.
   */
  public async validateEmailExistence() {
    return this.getContext().mongo.db.collection('profiles')
      .countDocuments({ 'email': this.email })
      .then((c) => c === 1);
  }

  /**
   * Sends an email message with a request token needed when resetting profile's password.
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
            'requestToken': generateResetProfilePasswordRequestToken(this.email, this.getContext()),
          },
        },
      ],
      template_id: 'd-702716106a5a4c1c80358400504191a5',
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
