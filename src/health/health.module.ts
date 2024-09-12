import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'
import { TerminusModule } from '@nestjs/terminus'
import { BalanceHealthIndicator } from './indicators/balance.indicator'
import { RedisHealthModule } from '@liaoliaots/nestjs-redis-health'
import { EcoRedisHealthIndicator } from './indicators/eco-redis.indicator'
import { MongoDBHealthIndicator } from './indicators/mongodb.indicator'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { AlchemyModule } from '../alchemy/alchemy.module'
import { PermissionHealthIndicator } from './indicators/permission.indicator'
import { BalanceModule } from '../balance/balance.module'

@Module({
  imports: [EcoConfigModule, BalanceModule, AlchemyModule, RedisHealthModule, TerminusModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    BalanceHealthIndicator,
    EcoRedisHealthIndicator,
    PermissionHealthIndicator,
    MongoDBHealthIndicator,
  ],
})
export class HealthModule {}
