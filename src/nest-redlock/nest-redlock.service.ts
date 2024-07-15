import { Inject, Injectable } from '@nestjs/common'
import Redlock from 'redlock'
import { Redis as IORedisClient, Cluster as IORedisCluster } from 'ioredis'
import { NestRedlockConfig, NEST_REDLOCK_CONFIG } from './nest-redlock.config'
import { RedisConnectionUtils } from '../common/redis/redis-connection-utils'

export type RedlockRedisClient = IORedisClient | IORedisCluster

@Injectable()
export class RedlockService extends Redlock {
  constructor(@Inject(NEST_REDLOCK_CONFIG) redlockConfig: NestRedlockConfig) {
    const { redlockSettings } = redlockConfig
    const redisClients = RedisConnectionUtils.getClientsForRedlock(redlockConfig)

    super(redisClients, redlockSettings)
  }
}
