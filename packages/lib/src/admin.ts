import logger from './logger'
import { Script } from './script'
import { SmartVaultFeeSettings, SmartVaultRelayerSettings } from './types'

export async function executeFeeSettings(script: Script, settings: SmartVaultFeeSettings): Promise<void> {
  const smartVault = script.dependencyAddress(settings.smartVault)
  const feeController = await script.dependencyInstance(settings.feeController)

  const { maxFeePct } = settings
  logger.info(`Setting max fee pct to ${maxFeePct}...`)
  await script.callContract(feeController, 'setMaxFeePercentage', [smartVault, maxFeePct], settings.from)
  logger.success(`Max fee pct set to ${maxFeePct}`)

  if (settings.feePct) {
    const { feePct, from } = settings
    logger.info(`Setting fee pct to ${feePct}...`)
    await script.callContract(feeController, 'setFeePercentage', [smartVault, feePct], from)
    logger.success(`Fee pct set to ${maxFeePct}`)
  }

  if (settings.feeCollector) {
    const { feeCollector, from } = settings
    const address = typeof feeCollector === 'string' ? feeCollector : script.dependencyAddress(feeCollector)
    logger.info(`Setting fee collector to ${address}...`)
    await script.callContract(feeController, 'setFeeCollector', [smartVault, address], from)
    logger.success(`Fee collector set to ${address}`)
  }
}

export async function executeRelayerSettings(script: Script, settings: SmartVaultRelayerSettings): Promise<void> {
  const smartVault = script.dependencyAddress(settings.smartVault)
  const relayer = await script.dependencyInstance(settings.relayer)

  if (settings.quota) {
    const { quota, from } = settings
    logger.info(`Setting relayer max quota to ${quota}...`)
    await script.callContract(relayer, 'setSmartVaultMaxQuota', [smartVault, quota], from)
    logger.success(`Relayer max quota set to ${quota}`)
  }

  if (settings.collector) {
    const { collector, from } = settings
    const address = typeof collector === 'string' ? collector : script.dependencyAddress(collector)
    logger.info(`Setting relayer collector to ${address}...`)
    await script.callContract(relayer, 'setSmartVaultCollector', [smartVault, address], from)
    logger.success(`Relayer collector set to ${address}`)
  }
}
