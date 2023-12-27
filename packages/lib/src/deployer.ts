import { assertEvent, ZERO_BYTES32 } from '@mimic-fi/v3-helpers'
import { Contract } from 'ethers'

import { executeFeeSettings, executeRelayerSettings } from './admin'
import { executePermissionChanges } from './authorizer'
import logger from './logger'
import { Script } from './script'
import {
  AuthorizerParams,
  Dependency,
  EnvironmentDeployment,
  EnvironmentSettingUpdate,
  EnvironmentUpdate,
  isDependency,
  isEnvironmentSettingUpdate,
  isEOA,
  isFeeSetting,
  isPermissionsUpdate,
  isRelayerSetting,
  isSmartVaultParams,
  isTaskParams,
  OptionalTaskConfig,
  PriceOracleParams,
  RegistryInstanceParams,
  SmartVaultParams,
  StandardTaskConfig,
  TaskParams,
} from './types'
import {
  isBridgeTaskConfig,
  isCollectTaskConfig,
  isConvexTaskConfig,
  isCurveTaskConfig,
  isDepositTaskConfig,
  isPrimitiveTaskConfig,
  isSwapTaskConfig,
  isTaskConfig,
} from './types/tasks/checks'
import {
  DEFAULT_GAS_LIMIT_CONFIG,
  DEFAULT_THRESHOLD_CONFIG,
  DEFAULT_TIME_LOCK_CONFIG,
  DEFAULT_TOKEN_INDEX_CONFIG,
  DEFAULT_VOLUME_LIMIT_CONFIG,
} from './types/tasks/defaults'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export async function deployEnvironment(script: Script, params: EnvironmentDeployment): Promise<void> {
  await deployAuthorizer(script, params.deployer, params.namespace, params.authorizer)
  await deployPriceOracle(script, params.deployer, params.namespace, params.priceOracle)

  for (const smartVaultParams of params.smartVaults) {
    await deploySmartVault(script, params.deployer, params.namespace, smartVaultParams)
  }

  for (const taskParams of params.tasks) {
    await deployTask(script, params.deployer, params.namespace, taskParams)
  }

  await executePermissionChanges(script, params.permissions)
  await executeFeeSettings(script, params.feeSettings)
  if (params.relayerSettings) await executeRelayerSettings(script, params.relayerSettings)
}

export async function updateEnvironment(script: Script, params: EnvironmentUpdate): Promise<void> {
  for (const step of params.steps) {
    if (isEnvironmentSettingUpdate(step)) {
      await updateEnvironmentSetting(script, step)
    } else if (isPermissionsUpdate(step)) {
      await executePermissionChanges(script, step)
    } else if (isSmartVaultParams(step)) {
      await deploySmartVault(script, params.deployer, params.namespace, step)
    } else if (isTaskParams(step)) {
      await deployTask(script, params.deployer, params.namespace, step)
    } else if (isFeeSetting(step)) {
      await executeFeeSettings(script, step)
    } else if (isRelayerSetting(step)) {
      await executeRelayerSettings(script, step)
    } else {
      logger.warn(`Unknown environment update step ${JSON.stringify(step)}`)
    }
  }
}

async function updateEnvironmentSetting(script: Script, step: EnvironmentSettingUpdate): Promise<void> {
  const args = step.args.map((arg: any) => (isDependency(arg) ? script.dependencyAddress(arg) : arg))
  const target = await script.dependencyInstance(step.target)
  logger.info(`Calling ${step.method} on ${target.address} with args [${JSON.stringify(args)}]...`)
  await script.callContract(target, step.method, args, step.from)
  logger.success(`Called ${step.method} on ${target.address} successfully`)
}

export async function deployAuthorizer(
  script: Script,
  deployer: Dependency,
  namespace: string,
  params: AuthorizerParams
): Promise<Contract> {
  return deploy('Authorizer', script, {
    deployer,
    namespace,
    name: params.name,
    from: params.from,
    version: params.version,
    initializeParams: {
      owners: params.owners,
      impl: script.dependencyAddress(params.version),
    },
  })
}

export async function deployPriceOracle(
  script: Script,
  deployer: Dependency,
  namespace: string,
  params: PriceOracleParams
): Promise<Contract> {
  return deploy('PriceOracle', script, {
    deployer,
    namespace,
    name: params.name,
    from: params.from,
    version: params.version,
    initializeParams: {
      authorizer: script.dependencyAddress(params.authorizer),
      signer: params.signer,
      pivot: params.pivot,
      feeds: params.feeds,
      impl: script.dependencyAddress(params.version),
    },
  })
}

export async function deploySmartVault(
  script: Script,
  deployer: Dependency,
  namespace: string,
  params: SmartVaultParams
): Promise<Contract> {
  return deploy('SmartVault', script, {
    deployer,
    namespace,
    name: params.name,
    from: params.from,
    version: params.version,
    initializeParams: {
      authorizer: script.dependencyAddress(params.authorizer),
      priceOracle: script.dependencyAddress(params.priceOracle),
      impl: script.dependencyAddress(params.version),
    },
  })
}

export async function deployTask(
  script: Script,
  deployer: Dependency,
  namespace: string,
  params: TaskParams
): Promise<Contract> {
  const isCustomTask = typeof params.version === 'string'
  const version: Dependency = isCustomTask ? { id: params.version as string } : (params.version as Dependency)

  const implementation = isCustomTask
    ? await script.deployAndVerify(params.version as string, [], params.from)
    : await script.dependencyInstance(params.version as Dependency)

  const customArgs = (params.args || []).map((arg) => (isDependency(arg) ? script.dependencyAddress(arg) : arg))
  await solveCounterfactualDepositorTokensSource(script, params, deployer, namespace)
  const args = [solveStandardTaskConfig(script, params.config), ...customArgs]

  return deploy('Task', script, {
    deployer,
    namespace,
    name: params.name,
    from: params.from,
    version,
    initializeParams: {
      impl: implementation.address,
      custom: isCustomTask,
      initializeData: implementation.interface.encodeFunctionData(params.initialize || 'initialize', args),
    },
  })
}

async function deploy(component: string, script: Script, params: RegistryInstanceParams): Promise<Contract> {
  const { namespace, name, from, version } = params
  if (!isEOA(from)) throw Error('Cannot deploy environment from other account type than EOA')
  const output = script.output({ ensure: false })[name]

  if (!output) {
    logger.info(`Deploying ${name}...`)
    const method = `deploy${component}`
    const deployer = await script.dependencyInstance(params.deployer)

    const tx = await script.callContract(deployer, method, [namespace, name, params.initializeParams], from)
    if (!tx) throw Error(`Could not fetch transaction receipt after creating a new ${component} instance`)
    const event = await assertEvent(tx, `${component}Deployed`)
    logger.success(`New ${name} instance at ${event.args.instance}`)
    const parsedVersion = version.key ? { id: version.id, key: version.key } : version.id
    script.save({ [name]: { version: parsedVersion, address: event.args.instance } })
    return script.dependencyInstanceAt(version, event.args.instance)
  } else {
    const address = typeof output === 'string' ? output : output.address
    logger.info(`${name} already deployed at ${address}`)
    return script.dependencyInstanceAt(version, address)
  }
}

function solveStandardTaskConfig(script: Script, config: StandardTaskConfig): StandardTaskConfig {
  if (isTaskConfig(config)) {
    solveOptionalTaskConfig(script, config)
  } else if (isPrimitiveTaskConfig(config)) {
    const anyConfig = config as any
    if (anyConfig.connector) solveConnectorDependency(script, anyConfig)
    solveOptionalTaskConfig(script, config.taskConfig)
  } else if (isSwapTaskConfig(config)) {
    solveConnectorDependency(script, config.baseSwapConfig)
    solveOptionalTaskConfig(script, config.baseSwapConfig.taskConfig)
  } else if (isBridgeTaskConfig(config)) {
    solveConnectorDependency(script, config.baseBridgeConfig)
    solveOptionalTaskConfig(script, config.baseBridgeConfig.taskConfig)
  } else if (isCurveTaskConfig(config)) {
    solveConnectorDependency(script, config.baseCurveConfig)
    solveOptionalTaskConfig(script, config.baseCurveConfig.taskConfig)
  } else if (isConvexTaskConfig(config)) {
    solveConnectorDependency(script, config.baseConvexConfig)
    solveOptionalTaskConfig(script, config.baseConvexConfig.taskConfig)
  }

  return config
}

function solveOptionalTaskConfig(script: Script, config: OptionalTaskConfig): void {
  if (isDependency(config.baseConfig.smartVault)) {
    config.baseConfig.smartVault = script.dependencyAddress(config.baseConfig.smartVault)
  }

  if (!config.baseConfig.previousBalanceConnectorId) config.baseConfig.previousBalanceConnectorId = ZERO_BYTES32
  if (!config.baseConfig.nextBalanceConnectorId) config.baseConfig.nextBalanceConnectorId = ZERO_BYTES32

  if (!config.gasLimitConfig) config.gasLimitConfig = DEFAULT_GAS_LIMIT_CONFIG
  else config.gasLimitConfig = { ...DEFAULT_GAS_LIMIT_CONFIG, ...config.gasLimitConfig }

  if (!config.timeLockConfig) config.timeLockConfig = DEFAULT_TIME_LOCK_CONFIG

  if (!config.tokenIndexConfig) config.tokenIndexConfig = DEFAULT_TOKEN_INDEX_CONFIG

  if (!config.tokenThresholdConfig) config.tokenThresholdConfig = DEFAULT_THRESHOLD_CONFIG
  else config.tokenThresholdConfig = { ...DEFAULT_THRESHOLD_CONFIG, ...config.tokenThresholdConfig }

  if (!config.volumeLimitConfig) config.volumeLimitConfig = DEFAULT_VOLUME_LIMIT_CONFIG
  else config.volumeLimitConfig = { ...DEFAULT_VOLUME_LIMIT_CONFIG, ...config.volumeLimitConfig }
}

function solveConnectorDependency(script: Script, baseConfig: { connector: string | Dependency }): void {
  if (typeof baseConfig.connector !== 'string') {
    baseConfig.connector = script.dependencyAddress(baseConfig.connector)
  }
}

async function solveCounterfactualDepositorTokensSource(
  script: Script,
  params: TaskParams,
  deployer: Dependency,
  namespace: string
): Promise<void> {
  if (
    isPrimitiveTaskConfig(params.config) &&
    isCollectTaskConfig(params.config) &&
    isDepositTaskConfig(params.config)
  ) {
    const deployerContract = await script.dependencyInstance(deployer)
    if (!isEOA(params.from)) throw Error('Cannot deploy environment from other account type than EOA')
    params.config.tokensSource = await deployerContract.getAddress(params.from?.address, namespace, params.name)
  }
}
