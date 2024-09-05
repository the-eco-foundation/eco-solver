import { Injectable, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { privateKeyAndNonceToAccountSigner } from './sign.helper'
import { LocalAccountSigner } from '@alchemy/aa-core'
import { jsonRpc } from 'viem/nonce'
@Injectable()
export class SignerService implements OnModuleInit {
  private signer: LocalAccountSigner<any>
  constructor(readonly ecoConfigService: EcoConfigService) {}

  async onModuleInit() {
    this.signer = this.buildSigner()
  }

  getSigner() {
    return this.signer
  }

  protected buildSigner(): LocalAccountSigner<any> {
    return privateKeyAndNonceToAccountSigner(
      jsonRpc(),
      `0x${this.ecoConfigService.getEth().privateKey}`,
    )
  }
}
