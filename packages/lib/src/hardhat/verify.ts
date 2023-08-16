import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Logger } from '../logger'
import { Script } from '../script'
import Verifier from '../verifier'

type VerifyArgs = { id: string; key: string; contract?: string; debug?: boolean }

task('verify', 'Run deployment task')
  .addParam('id', 'Deployment task ID')
  .addFlag('debug', 'Debug logs enabled')
  .addOptionalParam('contract', 'Deployed contract to verify')
  .addParam('key', 'Etherscan API key to verify contracts')
  .setAction(async (args: VerifyArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.setDefaults(false, args.debug || false)
    const verifier = args.key ? new Verifier(hre.network, args.key) : undefined
    const script = Script.fromHRE(args.id, hre, verifier)
    await script.verify(args.contract)
  })
