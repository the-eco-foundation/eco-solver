import { Injectable, Logger } from '@nestjs/common'
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Solver } from '../../eco-configs/eco-config.types'
import { InboxAbi } from '../../contracts'
import { Hex, zeroAddress } from 'viem'
import { SimpleAccountClientService } from '../../transaction/simple-account-client.service'

@Injectable()
export class PermissionHealthIndicator extends HealthIndicator {
  private logger = new Logger(PermissionHealthIndicator.name)
  private readonly solverPermissions: Map<string, { account: Hex; whitelisted: boolean }> =
    new Map()

  constructor(
    private readonly simpleAccountClientService: SimpleAccountClientService,
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

    const results = this.getStatus('permissions', isHealthy, { permissions: permissionsString })
    if (isHealthy) {
      return results
    }
    throw new HealthCheckError('Permissions failed', results)
  }

  private async loadPermissions(solver: Solver) {
    const key = this.getSolverKey(solver.network, solver.chainID, solver.solverAddress)
    const client = await this.simpleAccountClientService.getClient(solver.chainID)
    const inbox = {
      address: solver.solverAddress,
      abi: InboxAbi,
      functionName: 'solverWhitelist',
      args: [client.simpleAccountAddress],
    }
    const whitelisted = (await client.readContract(inbox)) as boolean
    this.solverPermissions.set(key, {
      account: client.simpleAccountAddress ?? zeroAddress,
      whitelisted,
    })
  }

  private getSolverKey(network: string, chainID: number, address: Hex): string {
    return `${network}-${chainID}-${address}`
  }
}
