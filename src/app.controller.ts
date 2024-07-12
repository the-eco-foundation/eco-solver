import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { SoucerIntentService } from './source-intent/source-intent.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly source: SoucerIntentService,
  ) {}

  @Get()
  getHello() {
    // return this.appService.getHello()
    return this.source.handleSourceIntentCreatedEvent('test')
    // return this.appService.getAws();
  }
}
