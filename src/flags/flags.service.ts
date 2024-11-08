import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import * as ld from '@launchdarkly/node-server-sdk'
import { KernelAccountClientService } from '../transaction/smart-wallets/kernel/kernel-account-client.service'

export const LaunchDarklyFlags = {
  bendWalletOnly: 'bendWalletOnly'
}
/**
 * Service class for interacting with the Launch Darkly feature flagging service
 */
@Injectable()
export class FlagsService implements OnModuleInit {
  private logger = new Logger(FlagsService.name)
  private flagsClient: ld.LDClient 
  private context: ld.LDContext 
  constructor(
    private readonly kernelAccountService: KernelAccountClientService,
    private readonly ecoConfigService: EcoConfigService,
  ) { 
  }

  async onModuleInit() {
    this.context ={ kind: 'solver-pod', key: await this.kernelAccountService.getAddress() }
    this.flagsClient = ld.init(this.ecoConfigService.getLaunchDarkly().apiKey)
    this.flagsClient.on('ready', () => {
      this.logger.log('Launch Darkly flags client is ready')
    })
    this.flagsClient.on(getFlagUpdateKey('bendWalletOnly'), async (value) => {
      this.logFlagUpdate('bendWalletOnly', value)
      const bendWalletOnly = await this.flagsClient.variation(LaunchDarklyFlags.bendWalletOnly, this.context ,false)
      this.logger.log(`bendWalletOnly flag is ${bendWalletOnly}`)
    })
  }

  private logFlagUpdate(flag: keyof typeof LaunchDarklyFlags, value: any) {
    this.logger.log(`Flag ${flag} updated to ${JSON.stringify(value)}`)
  }
}

function getFlagUpdateKey(flag: keyof typeof LaunchDarklyFlags) {
  return `update:${flag}`
}
