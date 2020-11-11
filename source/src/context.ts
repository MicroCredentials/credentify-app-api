import { Client } from '@0xcert/client';
import { BitskiProvider, SignMethod } from '@0xcert/ethereum-bitski-backend-provider';
import { ObjectId } from 'mongodb';
import { Env } from './config/env';
import { CommunityPermissionKind, ProfilePermissionKind } from './config/permissions';
import { SystemErrorCode } from './config/types';
import { SystemError } from './lib/errors';
import { readAuthToken } from './lib/jwt';
import { Mongo } from './lib/mongo';
import { Profile } from './models/profile';

/**
 * Request object context holds personalized request-based information.
 */
export class Context {
  public id: ObjectId;
  public env: Env;
  public mongo: Mongo;
  public profile: Profile;
  private _client: Client;

  /**
   * Class constructor.
   * @param stage Already connected stage instance.
   */
  public constructor(env: Env, mongo: Mongo) {
    this.id = new ObjectId();
    this.env = env;
    this.mongo = mongo;
    this._client = null;
  }

  /**
   * Client getter.
   */
  public get client(): Promise<Client> {
    return (async () => {
      if (this._client !== null) {
        return this._client;
      }

      const bitskiProvider = new BitskiProvider({
        clientId: this.env.bitskiClientId,
        credentialsId: this.env.bitskiCredentialsId,
        credentialsSecret: this.env.bitskiCredentialsSecret,
        accountId: this.env.executionerAddress,
        signMethod: SignMethod.ETH_SIGN,
        network: 'rinkeby',
        gatewayConfig: {
          actionsOrderId: this.env.actionsOrderId,
          assetLedgerDeployOrderId: this.env.assetLedgerDeployOrderId,
          valueLedgerDeployOrderId: this.env.valueLedgerDeployOrderId,
        },
      });

      this._client = new Client({
        provider: bitskiProvider,
        apiUrl: this.env.apiUrl,
      });

      try {
        await this._client.init();
        return this._client;
      } catch (error) {
        throw new SystemError(SystemErrorCode.BLOCKCHAIN_CONNECTION_FAILED);
      }
    })();
  }

  /**
   * Authenticates a profile from authentication token.
   * @param req ExpressJS request object.
   */
  public async authenticate(token: string) {
    const data = readAuthToken(token, this);

    if (data && data.profileId) {
      this.profile = await new Profile({}, { context: this }).populateById(data.profileId);
      if (!this.profile.isPersistant()) {
        this.profile = null;
      }
    } else {
      this.profile = null;
    }

    return this;
  }

  /**
   * Unauthenticates currently authenticated profile.
   */
  public unauthenticate() {
    this.profile = null;
    return this;
  }

  /**
   * Tells if a profile is authenticated.
   */
  public isAuthenticated() {
    return !!this.profile;
  }

  /**
   * Tells if a profile is authenticated and has a specific ID.
   * @param profileId Profile ID.
   */
  public isAuthenticatedAs(profileId: any) {
    return (
      this.isAuthenticated()
      && ObjectId.isValid(profileId)
      && this.profile.id === profileId
    );
  }

  /**
   * Checks if the authenticated profile has a specified profile permission.
   * @param permission Profile permission.
   */
  public hasProfilePermission(permission: ProfilePermissionKind) {
    return (
      this.profile
      && Array.isArray(this.profile.profileAbilities)
      && typeof permission === 'number'
      && !!this.profile.profileAbilities.find((a) => a.kind === permission)
    );
  }

  /**
   * Checks if the authenticated profile has specific community permission for chosen community.
   * @param communityId ID of chosen community.
   * @param permission Community permission.
   */
  public hasCommunityPermission(communityId: string, permission: CommunityPermissionKind) {
    return (
      this.profile
      && Array.isArray(this.profile.communityAbilities)
      && typeof permission === 'number'
      && typeof communityId === 'string'
      && !!this.profile.communityAbilities.find((a) => a.kind === permission && a.communityId.toString() === communityId)
    );
  }
}
