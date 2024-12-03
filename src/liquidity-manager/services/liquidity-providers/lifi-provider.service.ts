import { Injectable, Logger } from '@nestjs/common'
import { parseUnits } from 'viem'
import { getRoutes, RoutesRequest } from '@lifi/sdk'
import { EcoLogMessage } from '@/common/logging/eco-log-message'

@Injectable()
export class LiFiProviderService {
  private logger = new Logger(LiFiProviderService.name)

  getStrategy(): LiquidityManager.Strategy {
    return 'LiFi'
  }

  async getQuote(
    tokenIn: LiquidityManager.TokenData,
    tokenOut: LiquidityManager.TokenData,
    swapAmount: number,
  ): Promise<LiquidityManager.Quote> {
    const routesRequest: RoutesRequest = {
      fromChainId: tokenIn.chainId,
      toChainId: tokenOut.chainId,
      fromTokenAddress: tokenIn.config.address,
      toTokenAddress: tokenOut.config.address,
      fromAmount: parseUnits(swapAmount.toString(), tokenIn.balance.decimals).toString(),
    }

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: 'LiFiProviderService: calculating route',
        properties: routesRequest,
      }),
    )

    const result = await getRoutes(routesRequest)

    const [route] = result.routes

    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: 'LiFiProviderService: calculating route',
        properties: { routesRequest, route },
      }),
    )

    const slippage = 1 - parseFloat(route.toAmountMin) / parseFloat(route.toAmount)

    return {
      amountIn: BigInt(route.fromAmount),
      amountOut: BigInt(route.toAmount),
      slippage: slippage,
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      strategy: this.getStrategy(),
      context: route,
    }
  }
}
