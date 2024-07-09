import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EcoConfigModule } from './eco-configs/eco-config.module'

@Module({
  imports: [EcoConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
