import { emailValidator, presenceValidator } from '@rawmodel/validators';
import axios from 'axios';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode } from '../config/types';
import { generateCreateCommunityCollaboratorRequestToken } from '../lib/jwt';
import { stringParser, toObjectId } from '../lib/parsers';
import { ModelBase, ObjectId, prop } from './base';

/**
 * Add collaborator request model.
 */
export class CreateCommunityCollaboratorRequest extends ModelBase {

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
    ],
    fakeValue: 'me@domain.com',
  })
  public email: string;

  /**
   * Community ID.
   */
  @prop({
    parser: { resolver(v) { return toObjectId(v); }  },
    serializable: [SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMUNITY_COLLABORATORS_REQUEST_COMMUNITY_ID_NOT_PRESENT,
      },
    ],
    fakeValue: new ObjectId(),
  })
  public communityId: ObjectId;

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
            'requestToken': generateCreateCommunityCollaboratorRequestToken(this.email, this.communityId, this.getContext()),
            'communityId': this.communityId,
          },
        },
      ],
      template_id: 'd-d0618ac00fc346d881dee684f62ec133',
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
