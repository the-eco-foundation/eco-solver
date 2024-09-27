import { Injectable, Logger } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import { exec } from 'child_process'

@Injectable()
export class GitCommitHealthIndicator extends HealthIndicator {
  private logger = new Logger(GitCommitHealthIndicator.name)
  constructor() {
    super()
  }

  async gitCommit(): Promise<HealthIndicatorResult> {
    return this.getStatus('git-commit', true, { commitHash: await this.getCommitHash() })
  }

  private async getCommitHash(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec('git rev-parse HEAD', (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout.trim())
        }
      })
    })
  }
}
