import { bn, ZERO_ADDRESS } from '@mimic-fi/v3-helpers'

import logger from './logger'
import { Script } from './script'
import { SmartVaultFeeSettings, SmartVaultRelayerSettings } from './types'

export async function executeFeeSettings(script: Script, settings: SmartVaultFeeSettings): Promise<void> {
  const smartVault = script.dependencyAddress(settings.smartVault)
  const feeController = await script.dependencyInstance(settings.feeController)

  let currentFeeData = { max: bn(0), pct: bn(0), collector: ZERO_ADDRESS }
  try {
    currentFeeData = await feeController.getFee(smartVault)
  } catch (error) {
    // Get fee reverts in case there is no fee set (it's a safe-guard for withdrawals)
  }

  const { maxFeePct } = settings
  if (!currentFeeData.max.eq(maxFeePct)) {
    logger.info(`Setting max fee pct to ${maxFeePct}...`)
    await script.callContract(feeController, 'setMaxFeePercentage', [smartVault, maxFeePct], settings.from)
    logger.success(`Max fee pct set to ${maxFeePct}`)
  } else {
    logger.warn(`Max fee pct already set to ${maxFeePct}`)
  }

  if (settings.feePct) {
    const { feePct, from } = settings
    if (!currentFeeData.pct.eq(feePct)) {
      logger.info(`Setting fee pct to ${feePct}...`)
      await script.callContract(feeController, 'setFeePercentage', [smartVault, feePct], from)
      logger.success(`Fee pct set to ${feePct}`)
    } else {
      logger.warn(`Fee pct already set to ${feePct}`)
    }
  }

  if (settings.feeCollector) {
    const { feeCollector, from } = settings
    const address = typeof feeCollector === 'string' ? feeCollector : script.dependencyAddress(feeCollector)
    if (currentFeeData.collector.toLowerCase() != address.toLowerCase()) {
      logger.info(`Setting fee collector to ${address}...`)
      await script.callContract(feeController, 'setFeeCollector', [smartVault, address], from)
      logger.success(`Fee collector set to ${address}`)
    } else {
      logger.warn(`Fee collector already set to ${address}`)
    }
  }
}

export async function executeRelayerSettings(script: Script, settings: SmartVaultRelayerSettings): Promise<void> {
  const smartVault = script.dependencyAddress(settings.smartVault)
  const relayer = await script.dependencyInstance(settings.relayer)

  if (settings.quota) {
    const { quota, from } = settings
    const currentQuota = await relayer.getSmartVaultMaxQuota(smartVault)
    if (!currentQuota.eq(quota)) {
      logger.info(`Setting relayer max quota to ${quota}...`)
      await script.callContract(relayer, 'setSmartVaultMaxQuota', [smartVault, quota], from)
      logger.success(`Relayer max quota set to ${quota}`)
    } else {
      logger.warn(`Relayer max quota already set to ${quota}`)
    }
  }

  if (settings.collector) {
    const { collector, from } = settings
    const address = typeof collector === 'string' ? collector : script.dependencyAddress(collector)
    const currentCollector = await relayer.getSmartVaultCollector(smartVault)
    if (currentCollector.toLowerCase() != address.toLowerCase()) {
      logger.info(`Setting relayer collector to ${address}...`)
      await script.callContract(relayer, 'setSmartVaultCollector', [smartVault, address], from)
      logger.success(`Relayer collector set to ${address}`)
    } else {
      logger.warn(`Relayer collector already set to ${address}`)
    }
  }
}
