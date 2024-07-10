import { Logger } from '@nestjs/common'
import { RegisterQueueOptions } from '@nestjs/bullmq'
import * as Redis from 'ioredis'
import { EcoError } from '../errors/eco-error'
import { EcoLogMessage } from '../logging/eco-log-message'
import { QueueInterface } from './constants'
import { RedisConfig } from '../../eco-configs/eco-config.types'

export class RedisConnectionUtils {
  private static logger = new Logger(RedisConnectionUtils.name)

  static getQueueOptions(queue: QueueInterface, redisConfig: RedisConfig): RegisterQueueOptions {
    try {
      const connection = redisConfig.connection
      const { name, prefix } = queue

      if (this.isClusterConnection(connection)) {
        return this.getQueueOptionsForCluster(
          name,
          prefix,
          connection as Redis.ClusterNode[],
          redisConfig,
        )
      }

      return {
        name,
        prefix,
        connection,
      } as RegisterQueueOptions
    } catch (ex) {
      EcoError.logErrorWithStack(
        ex.message,
        `getQueueOptions: Invalid queue configuration`,
        this.logger,
        {
          queue,
        },
      )

      throw ex
    }
  }

  private static isClusterConnection(connection: Redis.ClusterNode | Redis.ClusterNode[]): boolean {
    return Array.isArray(connection)
  }

  private static getQueueOptionsForCluster(
    name: string,
    prefix: string,
    connection: Redis.ClusterNode[],
    redisConfig: RedisConfig,
  ): RegisterQueueOptions {
    // Setup a cluster.
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `getQueueOptionsForCluster: Setting up a redis cluster`,
      }),
    )

    const redisOptions = redisConfig.options.single

    const clusterOptions: Redis.ClusterOptions = {
      ...redisConfig.options.cluster,
      redisOptions,
    }

    return {
      name,
      prefix,
      connection: new Redis.Cluster(connection, clusterOptions),
    } as RegisterQueueOptions
  }
}
