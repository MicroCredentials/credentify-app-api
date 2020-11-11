import { arrayInclusionValidator } from '@rawmodel/validators';
import * as ethereumUtil from 'ethereumjs-util';
import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode, WalletKinds } from '../config/types';
import { integerParser, stringParser } from '../lib/parsers';
import { ethAddressValidator, presenceValidator } from '../lib/validators';
import { ModelBase, prop } from './base';
import { Profile } from './profile';

/**
 * Update profile wallet model.
 */
export class UpdateWallet extends ModelBase {

  /**
   * Kind property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    populatable: [PopulateStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.LINK_WALLET_KIND_NOT_PRESENT,
      },
      {
        resolver: arrayInclusionValidator({ values: [
          WalletKinds.META_MASK,
          WalletKinds.BITSKI,
        ]}),
        code: ValidatorErrorCode.LINK_WALLET_KIND_NOT_VALID,
      },
    ],
  })
  public kind: WalletKinds;

  /**
   * Wallet address property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializedStrategy.DB, SerializedStrategy.PROFILE],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.LINK_WALLET_PARSED_WALLET_ADDRESS_NOT_VALID,
      },
      {
        resolver: ethAddressValidator(),
        code: ValidatorErrorCode.LINK_WALLET_PARSED_WALLET_ADDRESS_NOT_VALID,
      },
    ],
  })
  public address: string;

  /**
   * Parses received user's signature and populates wallet address.
   */
  public async populateAddressBySignature(signature: string) {
    const context = this.getContext();
    if (signature) {
      try {
        const msg = Buffer.from(context.env.signingMessage);
        const hashedMsg = ethereumUtil.hashPersonalMessage(msg);
        const {v, r, s} = ethereumUtil.fromRpcSig(signature);

        const pubKey = ethereumUtil.ecrecover(ethereumUtil.toBuffer(hashedMsg), v, r, s);
        const addrBuf = ethereumUtil.pubToAddress(pubKey);
        const address = ethereumUtil.bufferToHex(addrBuf);
        const finalAddress = ethereumUtil.toChecksumAddress(address);

        if (finalAddress) {
          this.address = finalAddress;
        }
      } catch (error) {
        this.address = null;
      }
    } else {
      this.address = null;
    }
    return this.commit();
  }

  /**
   * Link new wallet to given profile.
   */
  public async update(profile: Profile) {
    await this.getContext().mongo.db
      .collection('profiles')
      .updateOne({
          _id: profile._id,
        },
        {
          $set: {
            wallet: this.serialize(SerializedStrategy.DB),
          },
        },
      );
    return this.commit();
  }
}
