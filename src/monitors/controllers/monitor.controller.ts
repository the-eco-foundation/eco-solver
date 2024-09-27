import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common'
import { AlchemyWebhookGuard } from '../guards/alchemy-webhook.guard'
import { MonitorService } from '../services/monitor.service'
import { EcoProtocolWebhookRequestInterface } from '../interfaces/eco-protocol-webhook-request.interface'

@Controller(MonitorService.getWebhookPath())
@UseGuards(AlchemyWebhookGuard)
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Post()
  @HttpCode(200)
  async webhook(@Body() webhook: EcoProtocolWebhookRequestInterface): Promise<any> {
    await this.monitorService.processWebhook(webhook)
    return { success: true }
  }
}
