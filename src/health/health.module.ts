import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'
import { TerminusModule } from '@nestjs/terminus'
import { BalanceHealthIndicator } from './indicators/balance.indicator'
import { RedisHealthModule } from '@liaoliaots/nestjs-redis-health'
import { EcoRedisHealthIndicator } from './indicators/eco-redis.indicator'
import { MongoDBHealthIndicator } from './indicators/mongodb.indicator'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { PermissionHealthIndicator } from './indicators/permission.indicator'
import { TransactionModule } from '../transaction/transaction.module'
import { GitCommitHealthIndicator } from './indicators/git-commit.indicator'

@Module({
  imports: [EcoConfigModule, TransactionModule, RedisHealthModule, TerminusModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    BalanceHealthIndicator,
    EcoRedisHealthIndicator,
    GitCommitHealthIndicator,
    PermissionHealthIndicator,
    MongoDBHealthIndicator,
  ],
})
export class HealthModule {}
