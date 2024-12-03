import { Injectable } from '@nestjs/common'
import { LiFiProviderService } from '@/liquidity-manager/services/liquidity-providers/lifi-provider.service'

@Injectable()
export class LiquidityProviderManagerService {
  constructor(protected readonly liFiProvider: LiFiProviderService) {}

  async getQuote(
    tokenIn: LiquidityManager.TokenData,
    tokenOut: LiquidityManager.TokenData,
    swapAmount: number,
  ): Promise<LiquidityManager.Quote> {
    return this.liFiProvider.getQuote(tokenIn, tokenOut, swapAmount)
  }
}
