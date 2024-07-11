import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EcoConfigModule } from './eco-configs/eco-config.module'
import { AlchemyModule } from './alchemy/alchemy.module'
import { ChainMonitorModule } from './chain-monitor/chain-monitor.module'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { LoggerModule } from 'nestjs-pino'
import { SolverModule } from './solver/solver.module'
import { MongooseModule } from '@nestjs/mongoose'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
  imports: [
    AlchemyModule,
    ChainMonitorModule,
    EcoConfigModule,
    EventEmitterModule.forRoot(),
    SolverModule,
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
  controllers: [AppController],
  providers: [AppService],
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
