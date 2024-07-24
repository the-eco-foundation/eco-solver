import { Inject, Injectable } from '@nestjs/common'
import Redlock, { Settings } from 'redlock'
import { Redis as IORedisClient, Cluster as IORedisCluster } from 'ioredis'
import { NestRedlockConfig, NEST_REDLOCK_CONFIG } from './nest-redlock.config'
import { RedisConnectionUtils } from '../common/redis/redis-connection-utils'
import { Lock } from 'redlock'

export type RedlockRedisClient = IORedisClient | IORedisCluster

@Injectable()
export class RedlockService extends Redlock {
  constructor(@Inject(NEST_REDLOCK_CONFIG) redlockConfig: NestRedlockConfig) {
    const { redlockSettings } = redlockConfig
    const redisClients = RedisConnectionUtils.getClientsForRedlock(redlockConfig)

    super(redisClients, redlockSettings)
  }

  /**
   * Non-throwing lock aquire that returns null if the lock is not available
   *
   * @param resources
   * @param duration time in ms
   * @param settings
   * @returns
   */
  async acquireLock(
    resources: string[],
    duration: number,
    settings?: Partial<Settings>,
  ): Promise<Lock | null> {
    try {
      return await this.acquire(resources, duration, settings)
    } catch {
      return null
    }
  }
}
