/* eslint-disable no-use-before-define */

import {
  BalanceError,
  BaseError,
  config,
  ErrorMessage,
  ExecutionOptions,
  fetchTxErrorDetails,
  getStatus,
  getStepTransaction,
  getTokenBalance,
  InteractionSettings,
  LiFiErrorCode,
  LiFiStepExtended,
  MultisigConfig,
  MultisigTransaction,
  MultisigTxDetails,
  ProviderError,
  SDKError,
  ServerError,
  StatusManager,
  StepExecutor,
  StepExecutorOptions,
  SwitchChainHook,
  TransactionError,
  TransactionParameters,
  UnknownError,
  ValidationError,
} from '@lifi/sdk'
import type {
  Chain,
  ExtendedChain,
  ExtendedTransactionInfo,
  FullStatusData,
  LiFiStep,
  Process,
  ProcessType,
  StatusMessage,
  StatusResponse,
  Substatus,
} from '@lifi/types'
import { ChainId } from '@lifi/types'
import {
  Abi,
  type Address,
  type Chain as ViemChain,
  type Client,
  createClient,
  encodeFunctionData,
  fallback,
  type Hash,
  http,
  type ReplacementReason,
  type ReplacementReturnType,
  type SendTransactionParameters,
  Transaction,
  type TransactionReceipt,
  webSocket,
} from 'viem'
import {
  getAddresses,
  getBlock,
  getChainId,
  readContract,
  sendTransaction,
  waitForTransactionReceipt as waitForTransactionReceiptInternal,
} from 'viem/actions'
import { mainnet } from 'viem/chains'
import { getAction } from 'viem/utils'

const defaultInteractionSettings = {
  allowInteraction: true,
  allowUpdates: true,
  allowExecution: true,
}

export abstract class BaseStepExecutor implements StepExecutor {
  public allowUserInteraction = true
  public allowExecution = true
  protected executionOptions?: ExecutionOptions
  protected statusManager: StatusManager

  constructor(options: StepExecutorOptions) {
    this.statusManager = new StatusManager(options.routeId)
    this.executionOptions = options.executionOptions
  }

  setInteraction = (settings?: InteractionSettings): void => {
    const interactionSettings = {
      ...defaultInteractionSettings,
      ...settings,
    }
    this.allowUserInteraction = interactionSettings.allowInteraction
    this.statusManager.allowUpdates(interactionSettings.allowUpdates)
    this.allowExecution = interactionSettings.allowExecution
  }

  abstract executeStep(step: LiFiStep): Promise<LiFiStep>
}

export const AddressZero = '0x0000000000000000000000000000000000000000'
export const AlternativeAddressZero = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const isZeroAddress = (address: string): boolean => {
  if (address === AddressZero || address === AlternativeAddressZero) {
    return true
  }
  return false
}

const parseEVMErrors = async (e: Error, step?: LiFiStep, process?: Process): Promise<SDKError> => {
  if (e instanceof SDKError) {
    e.step = e.step ?? step
    e.process = e.process ?? process
    return e
  }

  const baseError = await handleSpecificErrors(e, step, process)

  return new SDKError(baseError, step, process)
}

const handleSpecificErrors = async (e: any, step?: LiFiStep, process?: Process) => {
  if (e.cause?.name === 'UserRejectedRequestError') {
    return new TransactionError(LiFiErrorCode.SignatureRejected, e.message, e)
  }

  if (
    step &&
    process?.txHash &&
    e.code === LiFiErrorCode.TransactionFailed &&
    e.message === ErrorMessage.TransactionReverted
  ) {
    const response = await fetchTxErrorDetails(process.txHash, step.action.fromChainId)

    const errorMessage = response?.error_message

    if (errorMessage?.toLowerCase().includes('out of gas')) {
      return new TransactionError(LiFiErrorCode.GasLimitError, ErrorMessage.GasLimitLow, e)
    }
  }

  if (e instanceof BaseError) {
    return e
  }

  return new UnknownError(e.message || ErrorMessage.UnknownError, e)
}

const switchChain = async (
  client: Client,
  statusManager: StatusManager,
  step: LiFiStepExtended,
  allowUserInteraction: boolean,
  switchChainHook?: SwitchChainHook,
): Promise<Client | undefined> => {
  // if we are already on the correct chain we can proceed directly
  const currentChainId = await getChainId(client)
  if (currentChainId === step.action.fromChainId) {
    return client
  }

  // -> set status message
  step.execution = statusManager.initExecutionObject(step)
  statusManager.updateExecution(step, 'ACTION_REQUIRED')

  let switchProcess = statusManager.findOrCreateProcess({
    step,
    type: 'SWITCH_CHAIN',
    status: 'ACTION_REQUIRED',
  })

  if (!allowUserInteraction) {
    return
  }

  try {
    const updatedClient = await switchChainHook?.(step.action.fromChainId)
    let updatedChainId: number | undefined
    if (updatedClient) {
      updatedChainId = await getChainId(updatedClient)
    }
    if (updatedChainId !== step.action.fromChainId) {
      throw new ProviderError(LiFiErrorCode.ChainSwitchError, 'Chain switch required.')
    }

    switchProcess = statusManager.updateProcess(step, switchProcess.type, 'DONE')
    statusManager.updateExecution(step, 'PENDING')
    return updatedClient
  } catch (error: any) {
    statusManager.updateProcess(step, switchProcess.type, 'FAILED', {
      error: {
        message: error.message,
        code: LiFiErrorCode.ChainSwitchError,
      },
    })
    statusManager.updateExecution(step, 'FAILED')
    throw error
  }
}

interface WaitForTransactionReceiptProps {
  client: Client
  chainId: ChainId
  txHash: Hash
  onReplaced?: (response: ReplacementReturnType<ViemChain | undefined>) => void
}

const retryDelay = ({ count }: { count: number; error: Error }) =>
  Math.min(~~(1 << count) * 200, 3000)

export const retryCount = 30

async function waitForReceipt(
  client: Client,
  txHash: Hash,
  onReplaced?: (response: ReplacementReturnType<ViemChain | undefined>) => void,
): Promise<{
  transactionReceipt?: TransactionReceipt
  replacementReason?: ReplacementReason
}> {
  let replacementReason: ReplacementReason | undefined
  let transactionReceipt: TransactionReceipt | undefined

  try {
    transactionReceipt = await waitForTransactionReceiptInternal(client, {
      hash: txHash,
      onReplaced: (response) => {
        replacementReason = response.reason
        onReplaced?.(response)
      },
      retryCount,
      retryDelay,
    })
  } catch {
    // We can ignore errors from waitForTransactionReceipt as we have a status check fallback
  }

  return { transactionReceipt, replacementReason }
}

const getRpcUrls = async (chainId: ChainId): Promise<string[]> => {
  const rpcUrls = (await config.getRPCUrls())[chainId]
  if (!rpcUrls?.length) {
    throw new Error('RPC URL not found')
  }
  return rpcUrls
}

const publicClients: Record<number, Client> = {}

const getPublicClient = async (chainId: number): Promise<Client> => {
  if (!publicClients[chainId]) {
    const urls = await getRpcUrls(chainId)
    const fallbackTransports = urls.map((url) =>
      url.startsWith('wss')
        ? webSocket(url)
        : http(url, {
            batch: {
              batchSize: 64,
            },
          }),
    )
    const _chain = await config.getChainById(chainId)
    const chain: ViemChain = {
      ..._chain,
      ..._chain.metamask,
      name: _chain.metamask.chainName,
      rpcUrls: {
        default: { http: _chain.metamask.rpcUrls },
        public: { http: _chain.metamask.rpcUrls },
      },
    }
    // Add ENS contracts
    if (chain.id === ChainId.ETH) {
      chain.contracts = {
        ...mainnet.contracts,
        ...chain.contracts,
      }
    }
    publicClients[chainId] = createClient({
      chain: chain,
      transport: fallback(fallbackTransports),
      batch: {
        multicall: true,
      },
    })
  }

  if (!publicClients[chainId]) {
    throw new Error(`Unable to configure provider for chain ${chainId}`)
  }

  return publicClients[chainId]
}

async function waitForTransactionReceipt({
  client,
  chainId,
  txHash,
  onReplaced,
}: WaitForTransactionReceiptProps): Promise<TransactionReceipt | undefined> {
  let { transactionReceipt, replacementReason } = await waitForReceipt(client, txHash, onReplaced)

  if (!transactionReceipt?.status) {
    const publicClient = await getPublicClient(chainId)
    const result = await waitForReceipt(publicClient, txHash, onReplaced)
    transactionReceipt = result.transactionReceipt
    replacementReason = result.replacementReason
  }

  if (transactionReceipt?.status === 'reverted') {
    throw new TransactionError(LiFiErrorCode.TransactionFailed, 'Transaction was reverted.')
  }
  if (replacementReason === 'cancelled') {
    throw new TransactionError(LiFiErrorCode.TransactionCanceled, 'User canceled transaction.')
  }

  return transactionReceipt
}

const waitForApprovalTransaction = async (
  client: Client,
  txHash: Hash,
  processType: ProcessType,
  step: LiFiStep,
  chain: Chain,
  statusManager: StatusManager,
) => {
  statusManager.updateProcess(step, processType, 'PENDING', {
    txHash,
    txLink: `${chain.metamask.blockExplorerUrls[0]}tx/${txHash}`,
  })

  const transactionReceipt = await waitForTransactionReceipt({
    client: client,
    chainId: chain.id,
    txHash: txHash,
    onReplaced(response) {
      statusManager.updateProcess(step, processType, 'PENDING', {
        txHash: response.transaction.hash,
        txLink: `${chain.metamask.blockExplorerUrls[0]}tx/${response.transaction.hash}`,
      })
    },
  })

  const transactionHash = transactionReceipt?.transactionHash || txHash
  statusManager.updateProcess(step, processType, 'DONE', {
    txHash: transactionHash,
    txLink: `${chain.metamask.blockExplorerUrls[0]}tx/${transactionHash}`,
  })
}

const allowanceAbi: Abi = [
  {
    name: 'allowance',
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    outputs: [{ internalType: 'uint256', name: 'allowance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const getAllowance = async (
  chainId: ChainId,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
): Promise<bigint> => {
  const client = await getPublicClient(chainId)
  try {
    const approved = (await readContract(client, {
      address: tokenAddress as Address,
      abi: allowanceAbi,
      functionName: 'allowance',
      args: [ownerAddress, spenderAddress],
    })) as bigint
    return approved
  } catch (_e) {
    return 0n
  }
}

const median = (arr: bigint[]): bigint | undefined => {
  if (!arr.length) {
    return
  }
  const s = [...arr].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  const mid = Math.floor(s.length / 2)
  if (s.length % 2 === 0) {
    return (s[mid - 1] + s[mid]) / 2n
  }
  return s[mid]
}

const getMaxPriorityFeePerGas = async (client: Client): Promise<bigint | undefined> => {
  const block = await getBlock(client, {
    includeTransactions: true,
  })

  const maxPriorityFeePerGasList = (block.transactions as Transaction[])
    .filter((tx) => tx.maxPriorityFeePerGas)
    .map((tx) => tx.maxPriorityFeePerGas) as bigint[]

  if (!maxPriorityFeePerGasList.length) {
    return
  }

  let maxPriorityFeePerGasSum = 0n
  for (const value of maxPriorityFeePerGasList) {
    maxPriorityFeePerGasSum += value
  }

  const maxPriorityFeePerGasMedian = median(maxPriorityFeePerGasList) ?? 0n

  const maxPriorityFeePerGasAvg = maxPriorityFeePerGasSum / BigInt(maxPriorityFeePerGasList.length)

  return maxPriorityFeePerGasMedian > maxPriorityFeePerGasAvg
    ? maxPriorityFeePerGasAvg
    : maxPriorityFeePerGasMedian
}

const approveAbi: Abi = [
  {
    name: 'approve',
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    outputs: [{ internalType: 'bool', name: 'approved', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const setAllowance = async (
  client: Client,
  tokenAddress: string,
  contractAddress: string,
  amount: bigint,
  settings?: ExecutionOptions,
  returnPopulatedTransaction?: boolean,
): Promise<Hash> => {
  const data = encodeFunctionData({
    abi: approveAbi,
    functionName: 'approve',
    args: [contractAddress, amount],
  })

  if (returnPopulatedTransaction) {
    return data
  }

  let transactionRequest: TransactionParameters = {
    to: tokenAddress,
    data,
    maxPriorityFeePerGas:
      client.account?.type === 'local' ? await getMaxPriorityFeePerGas(client) : undefined,
  }

  if (settings?.updateTransactionRequestHook) {
    const customizedTransactionRequest: TransactionParameters =
      await settings.updateTransactionRequestHook({
        requestType: 'approve',
        ...transactionRequest,
      })

    transactionRequest = {
      ...transactionRequest,
      ...customizedTransactionRequest,
    }
  }

  return getAction(
    client,
    sendTransaction,
    'sendTransaction',
  )({
    to: transactionRequest.to,
    account: client.account!,
    data: transactionRequest.data,
    gas: transactionRequest.gas,
    gasPrice: transactionRequest.gasPrice,
    maxFeePerGas: transactionRequest.maxFeePerGas,
    maxPriorityFeePerGas: transactionRequest.maxPriorityFeePerGas,
    chain: null,
  } as SendTransactionParameters)
}

const substatusMessages: Record<StatusMessage, Partial<Record<Substatus, string>>> = {
  PENDING: {
    BRIDGE_NOT_AVAILABLE: 'Bridge communication is temporarily unavailable.',
    CHAIN_NOT_AVAILABLE: 'RPC communication is temporarily unavailable.',
    UNKNOWN_ERROR:
      'An unexpected error occurred. Please seek assistance in the LI.FI discord server.',
    WAIT_SOURCE_CONFIRMATIONS:
      'The bridge deposit has been received. The bridge is waiting for more confirmations to start the off-chain logic.',
    WAIT_DESTINATION_TRANSACTION:
      'The bridge off-chain logic is being executed. Wait for the transaction to appear on the destination chain.',
  },
  DONE: {
    PARTIAL: 'Some of the received tokens are not the requested destination tokens.',
    REFUNDED: 'The tokens were refunded to the sender address.',
    COMPLETED: 'The transfer is complete.',
  },
  FAILED: {},
  INVALID: {},
  NOT_FOUND: {},
}

function getSubstatusMessage(status: StatusMessage, substatus?: Substatus): string | undefined {
  if (!substatus) {
    return
  }
  return substatusMessages[status][substatus]
}

const waitForResult = async <T>(fn: () => Promise<T | undefined>, interval = 5000): Promise<T> => {
  let result: T | undefined
  while (!result) {
    result = await fn()
    if (!result) {
      await sleep(interval)
    }
  }
  return result
}

const TRANSACTION_HASH_OBSERVERS: Record<string, Promise<StatusResponse>> = {}

async function waitForReceivingTransaction(
  txHash: string,
  statusManager: StatusManager,
  processType: ProcessType,
  step: LiFiStep,
  interval = 5_000,
): Promise<StatusResponse> {
  const _getStatus = (): Promise<StatusResponse | undefined> => {
    return getStatus({
      fromChain: step.action.fromChainId,
      toChain: step.action.toChainId,
      txHash,
      ...(step.tool !== 'custom' && { bridge: step.tool }),
    })
      .then((statusResponse) => {
        switch (statusResponse.status) {
          case 'DONE':
            return statusResponse
          case 'PENDING':
            statusManager?.updateProcess(step, processType, 'PENDING', {
              substatus: statusResponse.substatus,
              substatusMessage:
                statusResponse.substatusMessage ||
                getSubstatusMessage(statusResponse.status, statusResponse.substatus),
              txLink: (statusResponse as FullStatusData).bridgeExplorerLink,
            })
            return undefined
          case 'NOT_FOUND':
            return undefined
          default:
            return Promise.reject()
        }
      })
      .catch(() => {
        return undefined
      })
  }

  let status = TRANSACTION_HASH_OBSERVERS[txHash]

  if (!status) {
    status = waitForResult(_getStatus, interval)
    TRANSACTION_HASH_OBSERVERS[txHash] = status
  }

  const resolvedStatus = await status

  if (!('receiving' in resolvedStatus)) {
    throw new ServerError("Status doesn't contain receiving information.")
  }

  return resolvedStatus
}

const checkAllowance = async (
  client: Client,
  chain: Chain,
  step: LiFiStep,
  statusManager: StatusManager,
  settings?: ExecutionOptions,
  allowUserInteraction = false,
  shouldBatchTransactions = false,
): Promise<Hash | void> => {
  // Ask the user to set an allowance
  let allowanceProcess: Process = statusManager.findOrCreateProcess({
    step,
    type: 'TOKEN_ALLOWANCE',
    chainId: step.action.fromChainId,
  })

  // Check allowance
  try {
    if (allowanceProcess.txHash && allowanceProcess.status !== 'DONE') {
      await waitForApprovalTransaction(
        client,
        allowanceProcess.txHash! as Address,
        allowanceProcess.type,
        step,
        chain,
        statusManager,
      )
    } else {
      allowanceProcess = statusManager.updateProcess(step, allowanceProcess.type, 'STARTED')

      const approved = await getAllowance(
        chain.id,
        step.action.fromToken.address,
        client.account!.address,
        step.estimate.approvalAddress,
      )

      const fromAmount = BigInt(step.action.fromAmount)

      if (fromAmount > approved) {
        if (!allowUserInteraction) {
          return
        }

        if (shouldBatchTransactions) {
          const approveTxHash = await setAllowance(
            client,
            step.action.fromToken.address,
            step.estimate.approvalAddress,
            fromAmount,
            settings,
            true,
          )

          allowanceProcess = statusManager.updateProcess(step, allowanceProcess.type, 'DONE')

          return approveTxHash
        }

        const approveTxHash = await setAllowance(
          client,
          step.action.fromToken.address,
          step.estimate.approvalAddress,
          fromAmount,
        )
        await waitForApprovalTransaction(
          client,
          approveTxHash,
          allowanceProcess.type,
          step,
          chain,
          statusManager,
        )
      } else {
        allowanceProcess = statusManager.updateProcess(step, allowanceProcess.type, 'DONE')
      }
    }
  } catch (e: any) {
    const error = await parseEVMErrors(e, step, allowanceProcess)
    allowanceProcess = statusManager.updateProcess(step, allowanceProcess.type, 'FAILED', {
      error: {
        message: error.cause.message,
        code: error.code,
      },
    })
    statusManager.updateExecution(step, 'FAILED')
    throw error
  }
}

function checkStepSlippageThreshold(oldStep: LiFiStep, newStep: LiFiStep): boolean {
  const setSlippage = oldStep.action.slippage
  const oldEstimatedToAmount = BigInt(oldStep.estimate.toAmountMin)
  const newEstimatedToAmount = BigInt(newStep.estimate.toAmountMin)
  const amountDifference = oldEstimatedToAmount - newEstimatedToAmount
  // oldEstimatedToAmount can be 0 when we use contract calls
  let actualSlippage = 0
  if (oldEstimatedToAmount > 0) {
    actualSlippage =
      Number((amountDifference * 1_000_000_000n) / oldEstimatedToAmount) / 1_000_000_000
  }
  return actualSlippage <= setSlippage
}

const stepComparison = async (
  statusManager: StatusManager,
  oldStep: LiFiStep,
  newStep: LiFiStep,
  allowUserInteraction: boolean,
  executionOptions?: ExecutionOptions,
): Promise<LiFiStep> => {
  // Check if changed exchange rate is in the range of slippage threshold
  if (checkStepSlippageThreshold(oldStep, newStep)) {
    return statusManager.updateStepInRoute(newStep)
  }

  let allowStepUpdate: boolean | undefined
  if (allowUserInteraction) {
    allowStepUpdate = await executionOptions?.acceptExchangeRateUpdateHook?.({
      oldToAmount: oldStep.estimate.toAmount,
      newToAmount: newStep.estimate.toAmount,
      toToken: newStep.action.toToken,
    })
  }

  if (!allowStepUpdate) {
    // The user declined the new exchange rate, so we are not going to proceed
    throw new TransactionError(
      LiFiErrorCode.ExchangeRateUpdateCanceled,
      'Exchange rate has changed!\nTransaction was not sent, your funds are still in your wallet.\nThe exchange rate has changed and the previous estimation can not be fulfilled due to value loss.',
    )
  }

  return statusManager.updateStepInRoute(newStep)
}

function sleep(ms: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), ms)
  })
}

const checkBalance = async (walletAddress: string, step: LiFiStep, depth = 0): Promise<void> => {
  const token = await getTokenBalance(walletAddress, step.action.fromToken)
  if (token) {
    const currentBalance = token.amount ?? 0n
    const neededBalance = BigInt(step.action.fromAmount)

    if (currentBalance < neededBalance) {
      if (depth <= 3) {
        await sleep(200)
        await checkBalance(walletAddress, step, depth + 1)
      } else if (
        (neededBalance * BigInt((1 - step.action.slippage) * 1_000_000_000)) / 1_000_000_000n <=
        currentBalance
      ) {
        // adjust amount in slippage limits
        step.action.fromAmount = currentBalance.toString()
      } else {
        throw new BalanceError('The balance is too low.')
      }
    }
  }
}

const getTransactionFailedMessage = async (step: LiFiStep, txLink?: string): Promise<string> => {
  const chain = await config.getChainById(step.action.toChainId)

  const baseString = `It appears that your transaction may not have been successful.
  However, to confirm this, please check your ${chain.name} wallet for ${step.action.toToken.symbol}.`
  return txLink
    ? `${baseString}
    You can also check the&nbsp;<a href="${txLink}" target="_blank" rel="nofollow noreferrer">block explorer</a> for more information.`
    : baseString
}

const updateMultisigRouteProcess = async (
  internalTxHash: Hash,
  step: LiFiStep,
  processType: ProcessType,
  fromChain: ExtendedChain,
  statusManager: StatusManager,
  multisig?: MultisigConfig,
) => {
  if (!multisig?.getMultisigTransactionDetails) {
    throw new Error('getMultisigTransactionDetails is missing in multisig config.')
  }

  const updateIntermediateMultisigStatus = () => {
    statusManager.updateProcess(step, processType, 'PENDING')
  }

  const multisigStatusResponse: MultisigTxDetails = await multisig?.getMultisigTransactionDetails(
    internalTxHash,
    fromChain.id,
    updateIntermediateMultisigStatus,
  )

  if (multisigStatusResponse.status === 'DONE') {
    statusManager.updateProcess(step, processType, 'PENDING', {
      txHash: multisigStatusResponse.txHash,
      multisigTxHash: undefined,
      txLink: `${fromChain.metamask.blockExplorerUrls[0]}tx/${multisigStatusResponse.txHash}`,
    })
  }

  if (multisigStatusResponse.status === 'FAILED') {
    throw new TransactionError(LiFiErrorCode.TransactionFailed, 'Multisig transaction failed.')
  }

  if (multisigStatusResponse.status === 'CANCELLED') {
    throw new TransactionError(LiFiErrorCode.SignatureRejected, 'Transaction was rejected by user.')
  }
}

export interface EVMStepExecutorOptions extends StepExecutorOptions {
  client: Client
  multisig?: MultisigConfig
}

export class CustomEVMStepExecutor extends BaseStepExecutor {
  private client: Client
  private multisig?: MultisigConfig

  constructor(options: EVMStepExecutorOptions) {
    super(options)
    this.client = options.client
    this.multisig = options.multisig
  }

  // Ensure that we are using the right chain and wallet when executing transactions.
  checkClient = async (step: LiFiStepExtended, process?: Process): Promise<Client | undefined> => {
    const updatedClient = await switchChain(
      this.client,
      this.statusManager,
      step,
      this.allowUserInteraction,
      this.executionOptions?.switchChainHook,
    )
    if (updatedClient) {
      this.client = updatedClient
    }

    // Prevent execution of the quote by wallet different from the one which requested the quote
    let accountAddress = this.client.account?.address
    if (!accountAddress) {
      const accountAddresses = await getAddresses(this.client)
      accountAddress = accountAddresses?.[0]
    }
    if (accountAddress !== step.action.fromAddress) {
      let processToUpdate = process
      if (!processToUpdate) {
        // We need to create some process if we don't have one so we can show the error
        processToUpdate = this.statusManager.findOrCreateProcess({
          step,
          type: 'TRANSACTION',
        })
      }
      const errorMessage =
        'The wallet address that requested the quote does not match the wallet address attempting to sign the transaction.'
      this.statusManager.updateProcess(step, processToUpdate.type, 'FAILED', {
        error: {
          code: LiFiErrorCode.WalletChangedDuringExecution,
          message: errorMessage,
        },
      })
      this.statusManager.updateExecution(step, 'FAILED')
      throw await parseEVMErrors(
        new TransactionError(LiFiErrorCode.WalletChangedDuringExecution, errorMessage),
        step,
        process,
      )
    }
    return updatedClient
  }

  executeStep = async (step: LiFiStepExtended): Promise<LiFiStepExtended> => {
    step.execution = this.statusManager.initExecutionObject(step)

    // Find if it's bridging and the step is waiting for a transaction on the receiving chain
    const recievingChainProcess = step.execution?.process.find(
      (process) => process.type === 'RECEIVING_CHAIN',
    )

    // Make sure that the chain is still correct
    // If the step is waiting for a transaction on the receiving chain, we do not switch the chain
    // All changes are already done from the source chain
    // Return the step
    if (recievingChainProcess?.substatus !== 'WAIT_DESTINATION_TRANSACTION') {
      const updatedClient = await this.checkClient(step)
      if (!updatedClient) {
        return step
      }
    }

    const isMultisigClient = !!this.multisig?.isMultisigWalletClient
    const multisigBatchTransactions: MultisigTransaction[] = []

    const shouldBatchTransactions =
      this.multisig?.shouldBatchTransactions && !!this.multisig.sendBatchTransaction

    const fromChain = await config.getChainById(step.action.fromChainId)
    const toChain = await config.getChainById(step.action.toChainId)

    const isBridgeExecution = fromChain.id !== toChain.id
    const currentProcessType = isBridgeExecution ? 'CROSS_CHAIN' : 'SWAP'

    // STEP 1: Check allowance
    const existingProcess = step.execution.process.find((p) => p.type === currentProcessType)

    // Check token approval only if fromToken is not the native token => no approval needed in that case
    const checkForAllowance =
      !existingProcess?.txHash &&
      !isZeroAddress(step.action.fromToken.address) &&
      (shouldBatchTransactions || !isMultisigClient)

    if (checkForAllowance) {
      const data = await checkAllowance(
        this.client,
        fromChain,
        step,
        this.statusManager,
        this.executionOptions,
        this.allowUserInteraction,
        shouldBatchTransactions,
      )

      if (data) {
        // allowance doesn't need value
        const baseTransaction: MultisigTransaction = {
          to: step.action.fromToken.address,
          data,
        }

        multisigBatchTransactions.push(baseTransaction)
      }
    }

    // STEP 2: Get transaction
    let process = this.statusManager.findOrCreateProcess({
      step,
      type: currentProcessType,
      chainId: fromChain.id,
    })

    if (process.status !== 'DONE') {
      const multisigProcess = step.execution.process.find((p) => !!p.multisigTxHash)

      try {
        if (isMultisigClient && multisigProcess) {
          const multisigTxHash = multisigProcess.multisigTxHash as Hash
          if (!multisigTxHash) {
            throw new ValidationError('Multisig internal transaction hash is undefined.')
          }
          await updateMultisigRouteProcess(
            multisigTxHash,
            step,
            process.type,
            fromChain,
            this.statusManager,
            this.multisig,
          )
        }

        let txHash: Hash
        if (process.txHash) {
          // Make sure that the chain is still correct
          const updatedClient = await this.checkClient(step, process)
          if (!updatedClient) {
            return step
          }

          // Wait for exiting transaction
          txHash = process.txHash as Hash
        } else {
          process = this.statusManager.updateProcess(step, process.type, 'STARTED')

          // Check balance
          await checkBalance(this.client.account!.address, step)

          // Create new transaction
          if (!step.transactionRequest) {
            const { ...stepBase } = step
            const updatedStep = await getStepTransaction(stepBase)
            const comparedStep = await stepComparison(
              this.statusManager,
              step,
              updatedStep,
              this.allowUserInteraction,
              this.executionOptions,
            )
            Object.assign(step, {
              ...comparedStep,
              execution: step.execution,
            })
          }

          if (!step.transactionRequest) {
            throw new TransactionError(
              LiFiErrorCode.TransactionUnprepared,
              'Unable to prepare transaction.',
            )
          }

          // STEP 3: Send the transaction
          // Make sure that the chain is still correct
          const updatedClient = await this.checkClient(step, process)
          if (!updatedClient) {
            return step
          }

          process = this.statusManager.updateProcess(step, process.type, 'ACTION_REQUIRED')

          if (!this.allowUserInteraction) {
            return step
          }

          let transactionRequest: TransactionParameters = {
            to: step.transactionRequest.to,
            from: step.transactionRequest.from,
            data: step.transactionRequest.data,
            value: step.transactionRequest.value
              ? BigInt(step.transactionRequest.value)
              : undefined,
            gas: step.transactionRequest.gasLimit
              ? BigInt(step.transactionRequest.gasLimit)
              : undefined,
            // gasPrice: step.transactionRequest.gasPrice
            //   ? BigInt(step.transactionRequest.gasPrice as string)
            //   : undefined,
            // maxFeePerGas: step.transactionRequest.maxFeePerGas
            //   ? BigInt(step.transactionRequest.maxFeePerGas as string)
            //   : undefined,
            maxPriorityFeePerGas:
              this.client.account?.type === 'local'
                ? await getMaxPriorityFeePerGas(this.client)
                : step.transactionRequest.maxPriorityFeePerGas
                  ? BigInt(step.transactionRequest.maxPriorityFeePerGas)
                  : undefined,
          }

          if (this.executionOptions?.updateTransactionRequestHook) {
            const customizedTransactionRequest: TransactionParameters =
              await this.executionOptions.updateTransactionRequestHook({
                requestType: 'transaction',
                ...transactionRequest,
              })

            transactionRequest = {
              ...transactionRequest,
              ...customizedTransactionRequest,
            }
          }

          if (shouldBatchTransactions && this.multisig?.sendBatchTransaction) {
            if (transactionRequest.to && transactionRequest.data) {
              const populatedTransaction: MultisigTransaction = {
                value: transactionRequest.value,
                to: transactionRequest.to,
                data: transactionRequest.data,
              }
              multisigBatchTransactions.push(populatedTransaction)

              txHash = await this.multisig?.sendBatchTransaction(multisigBatchTransactions)
            } else {
              throw new TransactionError(
                LiFiErrorCode.TransactionUnprepared,
                'Unable to prepare transaction.',
              )
            }
          } else {
            txHash = await getAction(
              this.client,
              sendTransaction,
              'sendTransaction',
            )({
              to: transactionRequest.to,
              account: this.client.account!,
              data: transactionRequest.data,
              value: transactionRequest.value,
              gas: transactionRequest.gas,
              gasPrice: transactionRequest.gasPrice,
              maxFeePerGas: transactionRequest.maxFeePerGas,
              maxPriorityFeePerGas: transactionRequest.maxPriorityFeePerGas,
              chain: null,
            } as SendTransactionParameters)
          }

          // STEP 4: Wait for the transaction
          if (isMultisigClient) {
            process = this.statusManager.updateProcess(step, process.type, 'ACTION_REQUIRED', {
              multisigTxHash: txHash,
            })
          } else {
            process = this.statusManager.updateProcess(step, process.type, 'PENDING', {
              txHash: txHash,
              txLink: `${fromChain.metamask.blockExplorerUrls[0]}tx/${txHash}`,
            })
          }
        }

        const transactionReceipt = await waitForTransactionReceipt({
          client: this.client,
          chainId: fromChain.id,
          txHash,
          onReplaced: (response) => {
            this.statusManager.updateProcess(step, process.type, 'PENDING', {
              txHash: response.transaction.hash,
              txLink: `${fromChain.metamask.blockExplorerUrls[0]}tx/${response.transaction.hash}`,
            })
          },
        })

        // if it's multisig wallet client and the process is in ACTION_REQUIRED
        // then signatures are still needed
        if (isMultisigClient && process.status === 'ACTION_REQUIRED') {
          await updateMultisigRouteProcess(
            transactionReceipt?.transactionHash || txHash,
            step,
            process.type,
            fromChain,
            this.statusManager,
            this.multisig,
          )
        }

        // Update pending process if the transaction hash from the receipt is different.
        // This might happen if the transaction was replaced.
        if (
          !isMultisigClient &&
          transactionReceipt?.transactionHash &&
          transactionReceipt.transactionHash !== txHash
        ) {
          process = this.statusManager.updateProcess(step, process.type, 'PENDING', {
            txHash: transactionReceipt.transactionHash,
            txLink: `${fromChain.metamask.blockExplorerUrls[0]}tx/${transactionReceipt.transactionHash}`,
          })
        }

        if (isBridgeExecution) {
          process = this.statusManager.updateProcess(step, process.type, 'DONE')
        }
      } catch (e: any) {
        const error = await parseEVMErrors(e, step, process)
        process = this.statusManager.updateProcess(step, process.type, 'FAILED', {
          error: {
            message: error.cause.message,
            code: error.code,
          },
        })
        this.statusManager.updateExecution(step, 'FAILED')

        throw error
      }
    }

    // STEP 5: Wait for the receiving chain
    const processTxHash = process.txHash
    if (isBridgeExecution) {
      process = this.statusManager.findOrCreateProcess({
        step,
        type: 'RECEIVING_CHAIN',
        status: 'PENDING',
        chainId: toChain.id,
      })
    }
    let statusResponse: FullStatusData

    try {
      if (!processTxHash) {
        throw new Error('Transaction hash is undefined.')
      }
      statusResponse = (await waitForReceivingTransaction(
        processTxHash,
        this.statusManager,
        process.type,
        step,
      )) as FullStatusData

      const statusReceiving = statusResponse.receiving as ExtendedTransactionInfo

      process = this.statusManager.updateProcess(step, process.type, 'DONE', {
        substatus: statusResponse.substatus,
        substatusMessage:
          statusResponse.substatusMessage ||
          getSubstatusMessage(statusResponse.status, statusResponse.substatus),
        txHash: statusReceiving?.txHash,
        txLink: `${toChain.metamask.blockExplorerUrls[0]}tx/${statusReceiving?.txHash}`,
      })

      this.statusManager.updateExecution(step, 'DONE', {
        fromAmount: statusResponse.sending.amount,
        toAmount: statusReceiving?.amount,
        toToken: statusReceiving?.token,
        gasCosts: [
          {
            amount: statusResponse.sending.gasAmount,
            amountUSD: statusResponse.sending.gasAmountUSD,
            token: statusResponse.sending.gasToken,
            estimate: statusResponse.sending.gasUsed,
            limit: statusResponse.sending.gasUsed,
            price: statusResponse.sending.gasPrice,
            type: 'SEND',
          },
        ],
      })
    } catch (e: unknown) {
      const htmlMessage = await getTransactionFailedMessage(step, process.txLink)

      process = this.statusManager.updateProcess(step, process.type, 'FAILED', {
        error: {
          code: LiFiErrorCode.TransactionFailed,
          message: 'Failed while waiting for receiving chain.',
          htmlMessage,
        },
      })
      this.statusManager.updateExecution(step, 'FAILED')
      throw await parseEVMErrors(e as Error, step, process)
    }

    // DONE
    return step
  }
}
