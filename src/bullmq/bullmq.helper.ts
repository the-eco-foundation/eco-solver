import { BullModule } from '@nestjs/bullmq'
import { DynamicModule } from '@nestjs/common'
import { EcoConfigService } from '@/eco-configs/eco-config.service'
import { RedisConnectionUtils } from '@/common/redis/redis-connection-utils'
import { QueueMetadata } from '@/common/redis/constants'

/**
 * Initialize the BullMQ queue with the given token and eco configs
 * @param {QueueMetadata} queueInterface queue interface
 * @returns
 */
export function initBullMQ(queueInterface: QueueMetadata): DynamicModule {
  return BullModule.registerQueueAsync({
    name: queueInterface.queue,
    useFactory: async (configService: EcoConfigService) => {
      return RedisConnectionUtils.getQueueOptions(queueInterface, configService.getRedis())
    },
    inject: [EcoConfigService],
  })
}
