import { Injectable } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { NonceService } from './nonce.service'
import { privateKeyAndNonceToAccountSigner } from './sign.helper'
import { SignerService } from './signer.service'
import { PrivateKeyAccount } from 'viem'

@Injectable()
export class AtomicSignerService extends SignerService {
  constructor(
    readonly nonceService: NonceService,
    readonly ecoConfigService: EcoConfigService,
  ) {
    super(ecoConfigService)
  }

  protected buildAccount(): PrivateKeyAccount {
    return privateKeyAndNonceToAccountSigner(
      this.nonceService,
      `0x${this.ecoConfigService.getEth().privateKey}`,
    )
  }
}
