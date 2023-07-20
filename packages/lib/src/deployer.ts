import { assertEvent, ZERO_BYTES32 } from '@mimic-fi/v3-helpers'
import { Contract } from 'ethers'

import { executePermissionChanges } from './authorizer'
import logger from './logger'
import { Script } from './script'
import {
  AuthorizerParams,
  Dependency,
  Environment,
  EnvironmentDeployment,
  EnvironmentUpdate,
  isDependency,
  isEOA,
  OptionalTaskConfig,
  PriceOracleParams,
  SmartVaultParams,
  StandardTaskConfig,
  TaskParams,
  TxParams,
} from './types'
import {
  isBridgeTaskConfig,
  isConvexTaskConfig,
  isCurveTaskConfig,
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

export async function deployEnvironment(
  script: Script,
  params: EnvironmentDeployment,
  txParams: TxParams
): Promise<Environment> {
  const deployer = await script.dependencyInstance(params.deployer)
  const env: Environment = { namespace: params.namespace, deployer }

  env.authorizer = await deployAuthorizer(script, env, params.authorizer, txParams)
  env.priceOracle = await deployPriceOracle(script, env, params.priceOracle, txParams)
  env.smartVault = await deploySmartVault(script, env, params.smartVault, txParams)

  for (const taskParams of params.tasks) {
    const task = await deployTask(script, env, taskParams, txParams)
    env.tasks = env.tasks?.concat(task)
  }

  await executePermissionChanges(script, env.authorizer, params.permissionChanges, txParams)
  return env
}

export async function updateEnvironment(
  script: Script,
  params: EnvironmentUpdate,
  txParams: TxParams
): Promise<Environment> {
  const deployer = await script.dependencyInstance(params.deployer)
  const env: Environment = { namespace: params.namespace, deployer }

  env.authorizer = await script.dependencyInstance(params.authorizer)

  for (const taskParams of params.tasks) {
    const task = await deployTask(script, env, taskParams, txParams)
    env.tasks = env.tasks?.concat(task)
  }

  await executePermissionChanges(script, env.authorizer, params.permissionChanges, txParams)
  return env
}

export async function deployAuthorizer(
  script: Script,
  env: Environment,
  params: AuthorizerParams,
  txParams: TxParams
): Promise<Contract> {
  const deployParams = {
    owners: params.owners,
    impl: script.dependencyAddress(params.version),
  }

  return deploy('Authorizer', script, env, params.name, params.version, deployParams, txParams)
}

export async function deployPriceOracle(
  script: Script,
  env: Environment,
  params: PriceOracleParams,
  txParams: TxParams
): Promise<Contract> {
  const deployParams = {
    authorizer: env.authorizer?.address,
    signer: params.signer,
    pivot: params.pivot,
    feeds: params.feeds,
    impl: script.dependencyAddress(params.version),
  }

  return deploy('PriceOracle', script, env, params.name, params.version, deployParams, txParams)
}

export async function deploySmartVault(
  script: Script,
  env: Environment,
  params: SmartVaultParams,
  txParams: TxParams
): Promise<Contract> {
  const deployParams = {
    authorizer: env.authorizer?.address,
    priceOracle: env.priceOracle?.address,
    impl: script.dependencyAddress(params.version),
  }

  return deploy('SmartVault', script, env, params.name, params.version, deployParams, txParams)
}

export async function deployTask(
  script: Script,
  env: Environment,
  params: TaskParams,
  txParams: TxParams
): Promise<Contract> {
  const isCustomTask = typeof params.version === 'string'
  const version: Dependency = isCustomTask ? { id: params.version as string } : (params.version as Dependency)

  const implementation = isCustomTask
    ? await script.deployAndVerify(params.version as string, [], txParams)
    : await script.dependencyInstance(params.version as Dependency)

  const args = [solveStandardTaskConfig(script, params.config), ...(params.args || [])]
  const deployParams = {
    impl: implementation.address,
    custom: isCustomTask,
    initializeData: implementation.interface.encodeFunctionData(params.initialize || 'initialize', args),
  }

  return deploy('Task', script, env, params.name, version, deployParams, txParams)
}

async function deploy(
  component: string,
  script: Script,
  env: Environment,
  name: string,
  version: Dependency,
  params: any,
  txParams: TxParams
): Promise<Contract> {
  if (!isEOA(txParams.from)) throw Error('Cannot deploy environment from other account type than EOA')
  const output = script.output({ ensure: false })[name]

  if (txParams.force || !output) {
    logger.info(`Deploying ${name}...`)
    const method = `deploy${component}`
    const tx = await script.callContract(env.deployer, method, [env.namespace, name, params], txParams.from)
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
  if (isTaskConfig(config)) solveOptionalTaskConfig(script, config)
  else if (isPrimitiveTaskConfig(config)) {
    // TODO: Solve counterfactual dependency for tokens source
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
