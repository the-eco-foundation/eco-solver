import * as crypto from 'crypto'
import { CanActivate, ExecutionContext, Injectable, Logger, RawBodyRequest } from '@nestjs/common'
import { EcoLogMessage } from '../../common/logging/eco-log-message'
import { MonitorService } from '../services/monitor.service'
import { EcoProtocolWebhookRequestInterface } from '../interfaces/eco-protocol-webhook-request.interface'

@Injectable()
export class AlchemyWebhookGuard implements CanActivate {
  private logger = new Logger(AlchemyWebhookGuard.name)

  constructor(private readonly ecoProtocolMonitorService: MonitorService) {}

  /**
   * Validate the signature of the webhook request.
   * @param rawBody
   * @param signature
   * @param signingKey
   */
  static isValidSignatureForStringBody(
    rawBody: string, // must be raw string body, not json transformed version of the body
    signature: string, // your "x-alchemy-signature" from header
    signingKey: string, // taken from dashboard for specific webhook
  ): boolean {
    const hmac = crypto.createHmac('sha256', signingKey) // Create a HMAC SHA256 hash using the signing key
    hmac.update(rawBody, 'utf8') // Update the token hash with the request body using utf8
    const digest = hmac.digest('hex')

    return signature === digest
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>()

    const rawBody = req.rawBody?.toString()
    const signature = req.headers['x-alchemy-signature']
    const body = req.body as unknown as EcoProtocolWebhookRequestInterface

    if (!rawBody || !signature || !body?.webhookId) {
      this.logger.error(
        EcoLogMessage.fromDefault({
          message: 'Alchemy webhook: invalid request',
          properties: { body, signature },
        }),
      )

      return false
    }

    const { webhook } = this.ecoProtocolMonitorService.getWebhookByID(body.webhookId)

    if (!webhook) {
      this.logger.error(
        EcoLogMessage.fromDefault({
          message: 'Alchemy webhook not found during signature verification',
          properties: { body },
        }),
      )

      return false
    }

    const isValid = AlchemyWebhookGuard.isValidSignatureForStringBody(
      rawBody,
      signature,
      webhook.signingKey,
    )

    if (!isValid) {
      this.logger.error(
        EcoLogMessage.fromDefault({
          message: 'Invalid Alchemy webhook signature',
          properties: { body },
        }),
      )

      return false
    }

    return isValid
  }
}
