import { PopulateStrategy, SerializedStrategy, ValidatorErrorCode, WalletKinds } from '../config/types';
import { integerParser, stringParser } from '../lib/parsers';
import { ethAddressValidator, presenceValidator } from '../lib/validators';
import { ModelBase, prop } from './base';

/**
 * Wallet model.
 */
export class Wallet extends ModelBase {
  /**
   * Address property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.WALLET_ADDRESS_NOT_PRESENT,
      },
      {
        resolver: ethAddressValidator(),
        code: ValidatorErrorCode.WALLET_ADDRESS_NOT_VALID,
      },
    ],
    fakeValue: '0xA257f4eF17c86Eb4d15A741A8D09e1EBb3953102',
  })
  public address: string;

  /**
   * Kind property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.PROFILE],
    serializable: [SerializedStrategy.PROFILE, SerializedStrategy.DB],
    fakeValue: WalletKinds.BITSKI,
  })
  public kind: WalletKinds;

}
