import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { parseUnits } from 'viem'
import { createConfig, executeRoute, getRoutes, RoutesRequest, SDKConfig } from '@lifi/sdk'
import { EcoLogMessage } from '@/common/logging/eco-log-message'
import { EcoConfigService } from '@/eco-configs/eco-config.service'
import { KernelAccountClientV2Service } from '@/transaction/smart-wallets/kernel/kernel-account-client-v2.service'
import { customEVM } from '@/liquidity-manager/services/liquidity-providers/LiFi/providers/evm/custom-evm'
import { logLiFiProcess } from '@/liquidity-manager/services/liquidity-providers/LiFi/utils/get-transaction-hashes'

@Injectable()
export class LiFiProviderService implements OnModuleInit {
  private logger = new Logger(LiFiProviderService.name)
  private walletAddress: string

  constructor(
    private readonly ecoConfigService: EcoConfigService,
    private readonly kernelAccountClientService: KernelAccountClientV2Service,
  ) {}

  async onModuleInit() {
    // Use first intent source's network as the default network
    const [intentSource] = this.ecoConfigService.getIntentSources()

    const client = await this.kernelAccountClientService.getClient(intentSource.chainID)
    this.walletAddress = client.account!.address

    // Configure LiFi providers
    createConfig({
      integrator: 'Eco',
      rpcUrls: this.getLiFiRPCUrls(),
      providers: [
        customEVM({
          getWalletClient: () => Promise.resolve(client),
          switchChain: (chainId) => this.kernelAccountClientService.getClient(chainId),
        }),
      ],
    })
  }

  getStrategy(): LiquidityManager.Strategy {
    return 'LiFi'
  }

  async getQuote(
    tokenIn: LiquidityManager.TokenData,
    tokenOut: LiquidityManager.TokenData,
    swapAmount: number,
  ): Promise<LiquidityManager.Quote> {
    const routesRequest: RoutesRequest = {
      // Origin chain
      fromAddress: this.walletAddress,
      fromChainId: tokenIn.chainId,
      fromTokenAddress: tokenIn.config.address,
      fromAmount: parseUnits(swapAmount.toString(), tokenIn.balance.decimals).toString(),

      // Destination chain
      toAddress: this.walletAddress,
      toChainId: tokenOut.chainId,
      toTokenAddress: tokenOut.config.address,
    }

    const result = await getRoutes(routesRequest)

    const [route] = result.routes

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

  async execute(quote: LiquidityManager.Quote<'LiFi'>) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: 'LiFiProviderService: executing quote',
        properties: {
          tokenIn: quote.tokenIn.config.address,
          chainIn: quote.tokenIn.config.chainId,
          tokenOut: quote.tokenIn.config.address,
          chainOut: quote.tokenIn.config.chainId,
          amountIn: quote.amountIn,
          amountOut: quote.amountOut,
          slippage: quote.slippage,
          gasCostUSD: quote.context.gasCostUSD,
          steps: quote.context.steps.map((step) => ({
            type: step.type,
            tool: step.tool,
          })),
        },
      }),
    )

    // Execute the quote
    return executeRoute(quote.context, {
      updateRouteHook: (route) => logLiFiProcess(this.logger, route),
      acceptExchangeRateUpdateHook: () => Promise.resolve(true),
    })
  }

  private getLiFiRPCUrls() {
    const rpcUrl = this.ecoConfigService.getChainRPCs()
    const lifiRPCUrls: SDKConfig['rpcUrls'] = {}

    for (const chainId in rpcUrl) {
      lifiRPCUrls[parseInt(chainId)] = [rpcUrl[chainId]]
    }

    return lifiRPCUrls
  }
}
