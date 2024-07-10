import { BaseExceptionFilter, HttpAdapterHost, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as Sentry from '@sentry/node'
import { NestExpressApplication } from '@nestjs/platform-express'
import { EcoConfigService } from './eco-configs/eco-config.service'
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino'
import { NestApplicationOptions } from '@nestjs/common'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, getNestParams())
  if (EcoConfigService.getStaticConfig().logger.usePino) {
    app.useLogger(app.get(Logger))
    app.useGlobalInterceptors(new LoggerErrorInterceptor())
  }

  // Starts listening for shutdown hooks
  app.enableShutdownHooks()

  const configService = app.get(EcoConfigService)

  // Initialize Sentry DNS
  Sentry.init({
    dsn: configService.getExternalAPIs().sentryDNS,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  })

  // Import the filter globally, capturing all exceptions on all routes
  const { httpAdapter } = app.get(HttpAdapterHost)
  Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter))

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
