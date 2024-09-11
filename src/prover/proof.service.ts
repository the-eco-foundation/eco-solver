import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { addSeconds, compareAsc } from 'date-fns'

@Injectable()
export class ProofService implements OnModuleInit {
  private logger = new Logger(ProofService.name)
  // set the minimum duration for a proof to be valid as a contstant to 7 days
  // TODO: update prover interace contract to return the duration here
  private static readonly PROOF_MINIMUM_DURATION_SECONDS = 60 * 60 * 24 * 7
  constructor() {}

  onModuleInit() {}

  isIntentExpirationWithinProofMinimumDate(chainID: number, expirationDate: Date): boolean {
    return compareAsc(expirationDate, this.getProofMinimumDate(chainID)) == 1
  }

  getProofMinimumDate(chainID: number): Date {
    return addSeconds(new Date(), this.getProofMinimumDurationSeconds(chainID))
  }

  //todo: update this to get the duration from the prover interface when its deployed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getProofMinimumDurationSeconds(chainID: number): number {
    return ProofService.PROOF_MINIMUM_DURATION_SECONDS
  }
}
