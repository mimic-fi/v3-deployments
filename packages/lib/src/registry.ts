import { assertEvent } from '@mimic-fi/v3-helpers'

import logger from './logger'
import { Script } from './script'
import { RegistryImplementationDeployment, TxParams } from './types'

export async function createRegistryImplementation(
  script: Script,
  params: RegistryImplementationDeployment,
  txParams: TxParams
): Promise<void> {
  const name = script.id
  const output = script.output({ ensure: false })[name]

  if (txParams.force || !output) {
    logger.info(`Registering ${name}...`)
    const bytecode = await script.getCreationCode(params.contract, params.args)
    const registry = await script.dependencyInstance(params.registry)
    const tx = await script.callContract(registry, 'create', [name, bytecode, params.stateless], txParams.from)
    if (tx) {
      const event = await assertEvent(tx, 'Registered', { name })
      logger.success(`${params.contract} registered as ${name} at ${event.args.implementation}`)
      script.save({ [params.contract]: event.args.implementation })
    } else {
      logger.warn(`Could not retrieve a receipt from the transaction. Possibly a safe tx needs to be confirmed.`)
    }
  }
}
