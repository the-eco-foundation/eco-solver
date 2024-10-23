import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { Network } from 'alchemy-sdk'
import { JobsOptions, Queue } from 'bullmq'
import { QUEUES } from '../common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { ViemEventLog } from '../common/events/viem'
import { erc20Abi, Hex, WatchContractEventReturnType, zeroHash } from 'viem'
import { SimpleAccountClientService } from '../transaction/smart-wallets/simple-account/simple-account-client.service'
import { convertBigIntsToStrings } from '../common/viem/utils'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { getIntentJobId } from '../common/utils/strings'

@Injectable()
export class BalanceWebsocketService implements OnApplicationBootstrap, OnModuleDestroy {
  private logger = new Logger(BalanceWebsocketService.name)
  private intentJobConfig: JobsOptions
  private unwatch: Record<string, WatchContractEventReturnType> = {}

  constructor(
    @InjectQueue(QUEUES.ETH_SOCKET.queue) private readonly ethQueue: Queue,
    private readonly simpleAccountClientService: SimpleAccountClientService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  async onApplicationBootstrap() {
    // await this.subscribeWS()
  }

  async onModuleDestroy() {
    // close all websockets
    Object.values(this.unwatch).forEach((unwatch) => unwatch())
  }

  async subscribeWS() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig

    const websocketTasks = Object.entries(this.ecoConfigService.getSolvers()).map(
      async ([, solver]) => {
        const client = await this.simpleAccountClientService.getClient(solver.chainID)
        // const instanceAddress = this.alchemyService.getWallet(solver.network).address

        Object.entries(solver.targets).forEach(([address, source]) => {
          // const [address, source] = targetEntity
          if (source.contractType === 'erc20') {
            this.unwatch[`${solver.chainID}-${address}`] = client.watchContractEvent({
              address: address as Hex,
              abi: erc20Abi,
              eventName: 'Transfer',
              // restrict transfers from anyone to the simple account address
              args: { to: client.simpleAccountAddress },
              onLogs: this.addJob(solver.network, solver.chainID) as any,
            })
          }
        })
      },
    )
    await Promise.all(websocketTasks)
  }

  addJob(network: Network, chainID: number) {
    return async (logs: ViemEventLog[]) => {
      const logTasks = logs.map((transferEvent) => {
        //bigint as it cant serialize to json
        transferEvent = convertBigIntsToStrings(transferEvent)
        //add network to the event
        transferEvent.sourceNetwork = network
        transferEvent.sourceChainID = BigInt(chainID)
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `ws: balance transfer`,
            properties: {
              transferEvent: transferEvent,
            },
          }),
        )
        //add to processing queue
        return this.ethQueue.add(QUEUES.ETH_SOCKET.jobs.erc20_balance_socket, transferEvent, {
          jobId: getIntentJobId(
            'websocket',
            transferEvent.transactionHash ?? zeroHash,
            transferEvent.logIndex ?? 0,
          ),
          ...this.intentJobConfig,
        })
      })
      await Promise.all(logTasks)
    }
  }
}
