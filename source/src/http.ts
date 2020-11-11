import * as express from 'express';
import { Server } from 'http';
import { Env } from './config/env';
import { Context } from './context';
import { Mongo } from './lib/mongo';
import { inject as injectContext } from './middlewares/context';
import { inject as injectCors } from './middlewares/cors';
import { inject as injectErrors } from './middlewares/errors';
import { inject as injectDataParser } from './middlewares/parser';
import { inject as injectRenders } from './middlewares/renders';
import { inject as injectAcceptCredential } from './routes/accept-credential';
import { inject as injectAuthProfile } from './routes/auth-profile';
import { inject as injectCompleteCredential } from './routes/complete-credential';
import { inject as injectCreateCommunity } from './routes/create-community';
import { inject as injectCreateCommunityAbility } from './routes/create-community-ability';
import { inject as injectCreateCommunityAchievement } from './routes/create-community-achievement';
import { inject as injectCreateCommunityCollaborator } from './routes/create-community-collaborator';
import { inject as injectCreateCommunityCollaboratorRequest } from './routes/create-community-collaborator-request';
import { inject as injectCreateKey } from './routes/create-community-key';
import { inject as injectCreateCredential } from './routes/create-credential';
import { inject as injectCreateProfile } from './routes/create-profile';
import { inject as injectCreateProfileCredentialRequest } from './routes/create-profile-credential-request';
import { inject as injectCreateProfilePayment } from './routes/create-profile-payment';
import { inject as injectCreateProfileRequest } from './routes/create-profile-request';
import { inject as injectDeleteCommunity } from './routes/delete-community';
import { inject as injectDeleteCommunityAbility } from './routes/delete-community-ability';
import { inject as injectDeleteCommunityAchievement } from './routes/delete-community-achievement';
import { inject as injectDeleteKey } from './routes/delete-community-key';
import { inject as injectDeleteKeyAbility } from './routes/delete-community-key-ability';
import { inject as injectDeleteCredential } from './routes/delete-credential';
import { inject as injectDeleteProfile } from './routes/delete-profile';
import { inject as injectFailCredential } from './routes/fail-credential';
import { inject as injectGetAchievement } from './routes/get-achievements';
import { inject as injectGetCommunitys } from './routes/get-communities';
import { inject as injectGetCommunityAbilities } from './routes/get-community-abilities';
import { inject as injectGetCommunityCollaborator } from './routes/get-community-collaborator';
import { inject as injectGetCommunityCollaborators } from './routes/get-community-collaborators';
import { inject as injectGetKeyAbilities } from './routes/get-community-key-abilities';
import { inject as injectGetCredentialEvidence } from './routes/get-credential-evidence';
import { inject as injectGetCredentialMetadata } from './routes/get-credential-metadata';
import { inject as injectGetCredentialsSchema } from './routes/get-credential-schema';
import { inject as injectGetCredentials } from './routes/get-credentials';
import { inject as injectGetProfile } from './routes/get-profile';
import { inject as injectGetProfileAbilities } from './routes/get-profile-abilities';
import { inject as injectGetProfileCredentials } from './routes/get-profile-credentials';
import { inject as injectGetProfilePayment } from './routes/get-profile-payment';
import { inject as injectGetProfilePayments } from './routes/get-profile-payments';
import { inject as injectGetRoot } from './routes/get-root';
import { inject as injectGetUsers } from './routes/get-users';
import { inject as injectProfileCancelCredentialRequest } from './routes/profile-cancel-credential-request';
import { inject as injectReceiveWebhooks } from './routes/receive-webhook';
import { inject as injectRejectCredential } from './routes/reject-credential';
import { inject as injectResetProfileEmail } from './routes/reset-profile-email';
import { inject as injectResetProfileEmailRequest } from './routes/reset-profile-email-request';
import { inject as injectResetProfilePassword } from './routes/reset-profile-password';
import { inject as injectResetProfilePasswordRequest } from './routes/reset-profile-password-request';
import { inject as injectUpdateCommunity } from './routes/update-community';
import { inject as injectUpdateCommunityAchievement } from './routes/update-community-achievement';
import { inject as injectUpdateKeyAbilities } from './routes/update-community-key-abilities';
import { inject as injectUpdateProfile } from './routes/update-profile';
import { inject as injectUpdateProfileWallet } from './routes/update-profile-wallet';
/**
 * ExpressJS request object interface which includes middlewares features.
 */
export interface Request extends express.Request {
  context: Context;
  body: { [key: string]: any };
}

/**
 * ExpressJS response object interface which includes middlewares features.
 */
export interface Response extends express.Response {
  respond(status: number, data: Object, meta?: Object): void;
  throw(status: number, errors: any): void;
}

/**
 * ExpressJS next function interface.
 */
export interface NextFunction extends express.NextFunction {}

/**
 * Http server config.
 */
export interface HttpServerConfig {
  env: Env;
  mongo: Mongo;
}

/**
 * HTTP server exposes REST API.
 */
export class HttpServer {
  public config: HttpServerConfig;
  public app: express.Application;
  public server: Server;

  /**
   * Class constructor.
   * @param env Environment variables.
   * @param mongo Already connected mongodb.
   */
  public constructor(config: HttpServerConfig) {
    this.config = config;

    this.app = express();
    injectRenders(this.app);
    injectCors(this.app);
    injectContext(this.app, this.config.env, this.config.mongo);
    injectDataParser(this.app);
    injectGetProfile(this.app);
    injectDeleteProfile(this.app);
    injectUpdateProfile(this.app);
    injectGetCommunitys(this.app);
    injectCreateCommunity(this.app);
    injectDeleteCommunity(this.app);
    injectUpdateCommunity(this.app);
    injectCreateKey(this.app);
    injectDeleteKey(this.app);
    injectGetKeyAbilities(this.app);
    injectUpdateKeyAbilities(this.app);
    injectDeleteKeyAbility(this.app);
    injectGetRoot(this.app);
    injectAuthProfile(this.app);
    injectCreateProfile(this.app);
    injectCreateProfileRequest(this.app);
    injectResetProfileEmailRequest(this.app);
    injectResetProfileEmail(this.app);
    injectResetProfilePasswordRequest(this.app);
    injectResetProfilePassword(this.app);
    injectCreateProfilePayment(this.app);
    injectGetProfileAbilities(this.app);
    injectGetProfilePayment(this.app);
    injectGetProfilePayments(this.app);
    injectCreateCommunityCollaboratorRequest(this.app);
    injectCreateCommunityCollaborator(this.app);
    injectGetCommunityCollaborators(this.app);
    injectGetCommunityCollaborator(this.app);
    injectGetCommunityAbilities(this.app);
    injectCreateCommunityAbility(this.app);
    injectDeleteCommunityAbility(this.app);
    injectCreateCommunityAchievement(this.app);
    injectUpdateCommunityAchievement(this.app);
    injectDeleteCommunityAchievement(this.app);
    injectCreateCredential(this.app);
    injectDeleteCredential(this.app);
    injectCompleteCredential(this.app);
    injectAcceptCredential(this.app);
    injectGetCredentials(this.app);
    injectGetProfileCredentials(this.app);
    injectGetAchievement(this.app);
    injectCreateProfileCredentialRequest(this.app);
    injectFailCredential(this.app);
    injectRejectCredential(this.app);
    injectProfileCancelCredentialRequest(this.app);
    injectUpdateProfileWallet(this.app);
    injectReceiveWebhooks(this.app);
    injectGetUsers(this.app);
    injectGetCredentialMetadata(this.app);
    injectGetCredentialEvidence(this.app);
    injectGetCredentialsSchema(this.app);
    injectErrors(this.app);
  }

  /**
   * Starts the server.
   * @param host Server hostname.
   * @param port Server listening port.
   */
  public async listen() {

    await new Promise((resolve) => {
      this.server = this.app.listen(
        this.config.env.httpPort,
        this.config.env.httpHost,
        resolve,
      );
    });

    return this;
  }

  /**
   * Stops the server.
   */
  public async close() {

    await new Promise((resolve) => {
      this.server.close(resolve);
      this.server = null;
    });

    return this;
  }

  /**
   * Returns an array of all available routes.
   */
  public collectRoutes(): { method: string, path: string }[] {
    return this.app.router['stack']
      .map((middleware) => middleware.route)
      .filter((route) => !!route)
      .map((route) => (
        Object.keys(route.methods).map((method) => ({
          method: method.toUpperCase(),
          path: route.path,
        }))
      ))
      .reduce((a, b) => a.concat(b), [])
      .sort((a, b) => `${a.path}@${a.method}`.localeCompare(`${b.path}@${b.method}`));
  }

}
