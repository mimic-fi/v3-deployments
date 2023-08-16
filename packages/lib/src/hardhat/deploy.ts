import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Logger } from '../logger'
import { Script } from '../script'
import Verifier from '../verifier'

type DeployArgs = { id: string; key?: string; debug?: boolean }

task('deploy', 'Run deployment task')
  .addParam('id', 'Deployment task ID')
  .addFlag('debug', 'Debug logs enabled')
  .addOptionalParam('key', 'Etherscan API key to verify contracts')
  .setAction(async (args: DeployArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.setDefaults(false, args.debug || false)
    const verifier = args.key ? new Verifier(hre.network, args.key) : undefined
    const script = Script.fromHRE(args.id, hre, verifier)
    await script.run()
  })
