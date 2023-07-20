import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Logger } from '../logger'
import { Script } from '../script'
import Verifier from '../verifier'

type DeployArgs = { id: string; force?: boolean; from?: string; key?: string; verbose?: boolean }

task('deploy', 'Run deployment task')
  .addParam('id', 'Deployment task ID')
  .addFlag('force', 'Ignore previous deployments')
  .addOptionalParam('key', 'Etherscan API key to verify contracts')
  .setAction(async (args: DeployArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.setDefaults(false, true)
    // Logger.setDefaults(false, args.verbose || false)
    const verifier = args.key ? new Verifier(hre.network, args.key) : undefined
    await Script.fromHRE(args.id, hre, verifier).run(args.from, args.force)
  })
