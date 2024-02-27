import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { Logger } from '../logger'
import { Script } from '../script'

type DeployArgs = { id: string; key?: string; debug?: boolean }

task('validate', 'Validate deployment task')
  .addParam('id', 'Deployment task ID')
  .addFlag('debug', 'Debug logs enabled')
  .setAction(async (args: DeployArgs, hre: HardhatRuntimeEnvironment) => {
    Logger.setDefaults(false, args.debug || false)
    const script = Script.fromHRE(args.id, hre)
    script.check()
  })
