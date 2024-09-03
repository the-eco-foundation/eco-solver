import { Module } from '@nestjs/common'
import { EcoConfigModule } from './eco-configs/eco-config.module'
import { AlchemyModule } from './alchemy/alchemy.module'
import { ChainMonitorModule } from './chain-monitor/chain-monitor.module'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { LoggerModule } from 'nestjs-pino'
import { SolverModule } from './solver/solver.module'
import { MongooseModule } from '@nestjs/mongoose'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { IntentModule } from './intent/intent.module'
import { SourceIntentModel } from './intent/schemas/source-intent.schema'
import { BalanceModule } from './balance/balance.module'
import { SignModule } from './sign/sign.module'

@Module({
  imports: [
    AlchemyModule,
    BalanceModule,
    ChainMonitorModule,
    EcoConfigModule,
    EventEmitterModule.forRoot({
      // the delimiter used to segment namespaces
      delimiter: '.',
    }),
    SolverModule,
    IntentModule,
    SignModule,
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
