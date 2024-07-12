import { BullModule } from '@nestjs/bullmq'
import { DynamicModule } from '@nestjs/common'
import { EcoConfigModule } from '../eco-configs/eco-config.module'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { RedisConnectionUtils } from '../common/redis/redis-connection-utils'
import { QueueInterface } from '../common/redis/constants'

/**
 * Initialize the BullMQ queue with the given token and eco configs
 * @param token the name of the queue
 * @returns
 */
export function initBullMQ(queueInterface: QueueInterface): DynamicModule {
  return BullModule.registerQueueAsync({
    name: queueInterface.name,
    imports: [EcoConfigModule],
    useFactory: async (configService: EcoConfigService) => {
      return RedisConnectionUtils.getQueueOptions(queueInterface, configService.getRedis())
    },
    inject: [EcoConfigService],
  })
}
