import { Module } from '@nestjs/common'
import { EcoConfigModule } from './eco-configs/eco-config.module'
import { AlchemyModule } from './alchemy/alchemy.module'
import { ChainMonitorModule } from './chain-monitor/chain-monitor.module'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { LoggerModule } from 'nestjs-pino'
import { SolverModule } from './solver/solver.module'
import { MongooseModule } from '@nestjs/mongoose'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RedlockModule } from './nest-redlock/nest-redlock.module'
import { SolveIntentModule } from './source-intent/source-intent.module'
import { BullModule } from '@nestjs/bullmq'
import { SourceIntentModel } from './source-intent/schemas/source-intent.schema'
export const queueConfig = BullModule.forRoot({
  connection: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
  },
})

@Module({
  imports: [
    AlchemyModule,
    ChainMonitorModule,
    EcoConfigModule,
    EventEmitterModule.forRoot({
      // the delimiter used to segment namespaces
      delimiter: '.',
    }),
    SolverModule,
    SolveIntentModule,
    SourceIntentModel,
    MongooseModule.forRootAsync({
      imports: [EcoConfigModule],
      inject: [EcoConfigService],
      useFactory: async (configService: EcoConfigService) => {
        const uri = configService.getMongooseUri()
        return {
          uri,
        }
      },
    }),
    RedlockModule.forRootAsync({
      imports: [EcoConfigModule],
      useFactory: async (configService: EcoConfigService) => {
        return {
          ...configService.getRedis(),
          settings: {
            // the expected clock drift; for more details
            // see http://redis.io/topics/distlock
            driftFactor: 0.01, // time in ms
            // the max number of times Redlock will attempt
            // to lock a resource before erroring
            retryCount: 10,
            // the time in ms between attempts
            retryDelay: 200, // time in ms
            // the max time in ms randomly added to retries
            // to improve performance under high contention
            retryJitter: 200, // time in ms
          },
        }
      },
      inject: [EcoConfigService],
    }),
    ...getPino(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

/**
 * Returns the Pino module if the configs have it on ( its off in dev )
 */
function getPino() {
  return EcoConfigService.getStaticConfig().logger.usePino
    ? [
        LoggerModule.forRootAsync({
          imports: [EcoConfigModule],
          inject: [EcoConfigService],
          useFactory: async (configService: EcoConfigService) => {
            const loggerConfig = configService.getLoggerConfig()
            return {
              pinoHttp: loggerConfig.pinoConfig.pinoHttp,
            }
          },
        }),
      ]
    : []
}
