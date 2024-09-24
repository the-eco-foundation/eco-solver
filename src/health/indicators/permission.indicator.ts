import { Injectable, Logger } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { MultichainSmartAccountService } from '../../alchemy/multichain_smart_account.service'
import { Solver } from '../../eco-configs/eco-config.types'
import { InboxAbi } from '../../contracts'
import { Hex, zeroAddress } from 'viem'

@Injectable()
export class PermissionHealthIndicator extends HealthIndicator {
  private logger = new Logger(PermissionHealthIndicator.name)
  private readonly solverPermissions: Map<string, { account: Hex; whitelisted: boolean }> =
    new Map()

  constructor(
    private readonly accountService: MultichainSmartAccountService,
    private readonly configService: EcoConfigService,
  ) {
    super()
  }

  async checkPermissions(): Promise<HealthIndicatorResult> {
    //iterate over all solvers
    await Promise.all(
      Object.entries(this.configService.getSolvers()).map(async (entry) => {
        const [, solver] = entry
        await this.loadPermissions(solver)
      }),
    )
    const isHealthy = Array.from(this.solverPermissions.values()).every(
      (value) => value.whitelisted,
    )
    const permissionsString = {}
    this.solverPermissions.forEach((value, key) => {
      permissionsString[key] = value
    })
    return this.getStatus('permissions', isHealthy, { permissions: permissionsString })
  }

  private async loadPermissions(solver: Solver) {
    const key = this.getSolverKey(solver.network, solver.chainID, solver.solverAddress)
    const client = await this.accountService.getClient(solver.chainID)
    const account = client.account?.address
    const inbox = {
      address: solver.solverAddress,
      abi: InboxAbi,
      functionName: 'solverWhitelist',
      args: [account],
    }
    const whitelisted = (await client.readContract(inbox)) as boolean
    this.solverPermissions.set(key, { account: account ?? zeroAddress, whitelisted })
  }

  private getSolverKey(network: string, chainID: number, address: Hex): string {
    return `${network}-${chainID}-${address}`
  }
}
