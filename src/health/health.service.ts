import { Injectable, Logger } from '@nestjs/common'

import { HealthCheckService } from '@nestjs/terminus'

import { BalanceHealthIndicator } from './indicators/balance.indicator'
import { EcoRedisHealthIndicator } from './indicators/eco-redis.indicator'
import { MongoDBHealthIndicator } from './indicators/mongodb.indicator'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { PermissionHealthIndicator } from './indicators/permission.indicator'

@Injectable()
export class HealthService {
  private logger = new Logger(HealthService.name)

  constructor(
    private readonly health: HealthCheckService,
    private readonly redisIndicator: EcoRedisHealthIndicator,
    private readonly mongoDBHealthIndicator: MongoDBHealthIndicator,
    private readonly permissionIndicator: PermissionHealthIndicator,
    private readonly balanceIndicator: BalanceHealthIndicator,
  ) {}

  async checkHealth() {
    const healthCheck = await this.health.check([
      () => this.redisIndicator.checkRedis(),
      () => this.mongoDBHealthIndicator.checkMongoDB(),
      () => this.permissionIndicator.checkPermissions(),
      () => this.balanceIndicator.checkBalances(),
    ])
    this.logger.log(
      EcoLogMessage.fromDefault({
        message: `HealthService.checkHealth()`,
        properties: {
          healthCheck: healthCheck,
        },
      }),
    )
    return healthCheck
  }
}
