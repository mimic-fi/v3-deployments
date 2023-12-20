import { assertIndirectEvent } from '@mimic-fi/v3-helpers'

import logger from './logger'
import { Script } from './script'
import { isSafeSigner, RegistryImplementationDeployment } from './types'

export async function createRegistryImplementation(
  script: Script,
  params: RegistryImplementationDeployment
): Promise<void> {
  const instanceName = params.instanceName || params.contract
  const output = script.output({ ensure: false })[instanceName]

  if (!output) {
    logger.info(`Registering ${params.name}...`)
    const bytecode = await script.getCreationCode(params.contract, params.args)
    const registry = await script.dependencyInstance(params.registry)
    const from = isSafeSigner(params.from) ? { ...params.from, wait: true } : params.from

    let tx
    try {
      tx = await script.callContract(registry, 'create', [params.name, bytecode, params.stateless], from)
    } catch (error) {
      if (!error.message.includes('exceeds block gas limit')) throw error
      const deployerIfFail = params.deployerIfFail || from
      const impl = await script.deployAndVerify(params.contract, params.args, deployerIfFail, instanceName)
      tx = await script.callContract(registry, 'register', [params.name, impl.address, params.stateless], from)
    }

    if (tx) {
      const event = await assertIndirectEvent(tx, registry.interface, 'Registered', { name: params.name })
      logger.success(`${params.contract} registered as ${params.name} at ${event.args.implementation}`)
      script.save({ [params.contract]: event.args.implementation })
      await script.verify(params.contract)
    } else {
      logger.warn(`Could not retrieve a receipt from the transaction. Possibly a safe tx needs to be executed.`)
    }

    if (params.deprecate) {
      logger.info(`Deprecating ${params.deprecate.id}...`)
      const address = script.dependencyAddress(params.deprecate)
      if (!(await registry.isDeprecated(address))) {
        await script.callContract(registry, 'deprecate', [address], from)
        logger.success(`${params.deprecate.id} deprecated successfully`)
      } else {
        logger.warn(`${params.deprecate.id} already deprecated`)
      }
    }
  }
}
