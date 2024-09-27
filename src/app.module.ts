import { Module } from '@nestjs/common'
import { EcoConfigModule } from './eco-configs/eco-config.module'
import { ChainMonitorModule } from './chain-monitor/chain-monitor.module'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { LoggerModule } from 'nestjs-pino'
import { MongooseModule } from '@nestjs/mongoose'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { IntentModule } from './intent/intent.module'
import { SourceIntentModel } from './intent/schemas/source-intent.schema'
import { BalanceModule } from './balance/balance.module'
import { SignModule } from './sign/sign.module'
import { ProverModule } from './prover/prover.module'
import { HealthModule } from './health/health.module'
import { ProcessorModule } from './bullmq/processors/processor.module'
import { MonitorModule } from './monitors/monitor.module'

@Module({
  imports: [
    BalanceModule,
    ChainMonitorModule,
    EcoConfigModule,
    EventEmitterModule.forRoot({
      // the delimiter used to segment namespaces
      delimiter: '.',
    }),
    HealthModule,
    IntentModule,
    SignModule,
    SourceIntentModel,
    ProcessorModule,
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
    ProverModule,
    MonitorModule,
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
