import { Injectable, OnModuleInit } from '@nestjs/common'
import { JobsOptions } from 'bullmq'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { NonceService } from './nonce.service'
import { privateKeyAndNonceToAccountSigner } from './sign.helper'
import { LocalAccountSigner } from '@alchemy/aa-core'

@Injectable()
export class SignerService implements OnModuleInit {
  private signer: LocalAccountSigner<any>
  constructor(
    private readonly nonceService: NonceService,
    private readonly ecoConfigService: EcoConfigService,
  ) {
    const ethConfigs = this.ecoConfigService.getEth()
    this.signer = privateKeyAndNonceToAccountSigner(this.nonceService, `0x${ethConfigs.privateKey}`)
  }
  async onModuleInit() {

  }

  getSigner() {
    return this.signer
  }

}
