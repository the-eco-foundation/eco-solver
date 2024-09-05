import { Injectable } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { NonceService } from './nonce.service'
import { privateKeyAndNonceToAccountSigner } from './sign.helper'
import { LocalAccountSigner } from '@alchemy/aa-core'
import { SignerService } from './signer.service'

@Injectable()
export class AtomicSignerService extends SignerService {
  constructor(
    readonly nonceService: NonceService,
    readonly ecoConfigService: EcoConfigService,
  ) {
    super(ecoConfigService)
  }

  protected buildSigner(): LocalAccountSigner<any> {
    return privateKeyAndNonceToAccountSigner(
      this.nonceService,
      `0x${this.ecoConfigService.getEth().privateKey}`,
    )
  }
}
