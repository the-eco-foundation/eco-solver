import { Injectable, Logger } from '@nestjs/common'
import { HealthIndicatorResult } from '@nestjs/terminus'
import { Redis } from 'ioredis'
import { RedisHealthIndicator } from '@liaoliaots/nestjs-redis-health'
import { EcoConfigService } from '../../eco-configs/eco-config.service'

@Injectable()
export class EcoRedisHealthIndicator extends RedisHealthIndicator {
  private logger = new Logger(EcoRedisHealthIndicator.name)
  private readonly redis: Redis
  constructor(private readonly configService: EcoConfigService) {
    super()
    // const config = RedisConnectionUtils.getQueueOptions(
    //   QUEUES.SOURCE_INTENT,
    //   configService.getRedis(),
    // )
    // this.redis = new Redis(config)
  }
  async checkRedis(): Promise<HealthIndicatorResult> {
    return this.checkHealth('redis', {
      type: 'redis',
      client: this.redis,
      timeout: 500,
    })
  }
}
