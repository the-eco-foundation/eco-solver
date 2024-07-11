import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino'
import { NestApplicationOptions } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, getNestParams())
  if (EcoConfigService.getStaticConfig().logger.usePino) {
    app.useLogger(app.get(Logger))
    app.useGlobalInterceptors(new LoggerErrorInterceptor())
  }

  // Starts listening for shutdown hooks
  app.enableShutdownHooks()
  await app.listen(3001)
}

function getNestParams(): NestApplicationOptions {
  let params = {
    cors: true,
    rawBody: true, //needed for AlchemyAuthMiddleware webhook verification
  }
  if (EcoConfigService.getStaticConfig().logger.usePino) {
    params = {
      ...params,
      ...{
        bufferLogs: true,
      },
    }
  }

  return params
}

bootstrap()
