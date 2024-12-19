import { EVM, EVMProvider, EVMProviderOptions, StepExecutorOptions } from '@lifi/sdk'
import { CustomEVMStepExecutor } from '@/liquidity-manager/services/liquidity-providers/LiFi/providers/evm/custom-evm-step-executor'

export function customEVM(options?: EVMProviderOptions): EVMProvider {
  const _options: EVMProviderOptions = options ?? {}
  const base = EVM(options)
  return {
    ...base,
    async getStepExecutor(options: StepExecutorOptions): ReturnType<typeof base.getStepExecutor> {
      if (!_options.getWalletClient) {
        throw new Error('Client is not provided.')
      }

      const walletClient = await _options.getWalletClient()

      return new CustomEVMStepExecutor({
        client: walletClient,
        multisig: _options.multisig,
        routeId: options.routeId,
        executionOptions: {
          ...options.executionOptions,
          switchChainHook: _options.switchChain ?? options.executionOptions?.switchChainHook,
        },
      })
    },
    setOptions(options: EVMProviderOptions) {
      Object.assign(_options, options)
    },
  }
}
