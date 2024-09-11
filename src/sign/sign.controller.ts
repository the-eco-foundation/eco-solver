import { Controller, Get } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { MultichainSmartAccountService } from '../alchemy/multichain_smart_account.service'

@Controller('sign')
export class SignController {
  private logger = new Logger(SignController.name)
  constructor(private readonly aa: MultichainSmartAccountService) {}
  @Get()
  async fake() {
    await this.aa.getClient(84532)
    // const ans = await client.account.getNonce()
    // console.log(ans, client.account.address)

    return
  }
}
