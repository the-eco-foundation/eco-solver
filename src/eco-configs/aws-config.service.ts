import { SecretsManager } from '@aws-sdk/client-secrets-manager'
import { AwsCredentials } from './eco-config.types'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as config from 'config'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { ConfigSource } from './interfaces/config-source.interface'

@Injectable()
export class AwsConfigService implements OnModuleInit, ConfigSource {
  private logger = new Logger(AwsConfigService.name)
  private _awsConfigs: Record<string, string> = {}
  constructor() {}

  async onModuleInit() {
    await this.initConfigs()
  }

  getConfig() {
    return this.awsConfigs
  }

  // Initialize the configs
  async initConfigs() {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `Initializing aws configs`,
      }),
    )
    const awsCreds = config.get('aws') as AwsCredentials
    this._awsConfigs = await getSecrets(awsCreds)
  }

  get awsConfigs(): Record<string, string> {
    return this._awsConfigs
  }
}

export default async function getSecrets(
  awsCreds: AwsCredentials,
): Promise<Record<string, string>> {
  const secretsManager = new SecretsManager({
    region: awsCreds.region,
  })
  try {
    const data = await secretsManager.getSecretValue({ SecretId: awsCreds.secretID })
    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString)
      return secret as Record<string, string>
    }
  } catch (err) {
    console.error(err)
  }
  return {}
}
