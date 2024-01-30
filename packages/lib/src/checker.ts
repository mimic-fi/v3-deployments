import logger from './logger'
import { Script } from './script'
import { Dependency, EnvironmentDeployment, OptionalTaskConfig, TaskParams } from './types'
import {
  isBridgeTaskConfig,
  isConvexTaskConfig,
  isCurveTaskConfig,
  isPrimitiveTaskConfig,
  isSwapTaskConfig,
  isTaskConfig,
  isWithdrawTaskConfig,
} from './types/tasks/checks'

const PRIMITIVES = ['wrap', 'unwrap', 'collect', 'withdraw', 'call', 'execute']

export default class DeploymentChecker {
  private script: Script
  private errors: number
  private warnings: number

  constructor(script: Script) {
    this.script = script
    this.errors = 0
    this.warnings = 0
  }

  call(input: EnvironmentDeployment): boolean {
    this.errors = 0
    this.warnings = 0
    this.checkDeployer(input)
    this.checkAuthorizer(input)
    this.checkPriceOracle(input)
    this.checkSmartVault(input)
    this.checkTasks(input)
    this.checkPermissions(input)
    this.checkFeeSettings(input)
    this.checkRelayerSettings(input)
    return this.warnings == 0 && this.errors == 0
  }

  private checkDeployer(input: EnvironmentDeployment): void {
    if (!input.deployer.id.startsWith('core/deployer')) this.warn('Unexpected deployer version')
  }

  private checkAuthorizer(input: EnvironmentDeployment): void {
    if (!input.authorizer.version.id.startsWith('core/authorizer')) this.warn('Unexpected authorizer version')
  }

  private checkPriceOracle(input: EnvironmentDeployment): void {
    if (!input.priceOracle.version.id.startsWith('core/price-oracle')) this.warn('Unexpected price oracle version')
  }

  private checkSmartVault(input: EnvironmentDeployment): void {
    this.checkNonDuplicatedNames(input.smartVaults)
    for (const { name, version, authorizer, priceOracle } of input.smartVaults) {
      if (!version.id.startsWith('core/smart-vault')) this.warn(`Unexpected smart vault ${name} version`)
      if (!authorizer.id.startsWith(input.authorizer.name)) this.warn(`Smart vault ${name} authorizer does not match`)
      if (!priceOracle.id.startsWith(input.priceOracle.name)) this.warn(`Smart vault ${name} oracle does not match`)
    }
  }

  private checkTasks(input: EnvironmentDeployment): void {
    this.checkNonDuplicatedNames(input.tasks)
    this.checkBalanceConnectors(input.tasks)
    this.checkBridgeOrWithdrawTask(input.tasks)
    this.checkRelayerRelatedTask(input.tasks)

    for (const task of input.tasks) {
      const isExpectedTask = typeof task.version !== 'string' && task.version.id.startsWith('core/tasks')
      if (!isExpectedTask) this.warn(`Unexpected task ${task.name} version`)

      const config = this.getTaskConfig(task)
      const isExpectedSmartVault = config && this.isExpectedSmartVault(input, config.baseConfig)
      if (!isExpectedSmartVault) this.warn(`Unexpected smart vault version for task ${task.name}`)
    }
  }

  private checkBalanceConnectors(input: TaskParams[]): void {
    const previousBalanceConnectors = input
      .map((task) => this.getTaskConfig(task))
      .map((config) => config?.baseConfig?.previousBalanceConnectorId)
      .filter((connectors) => connectors !== undefined)

    const nextBalanceConnectors = input
      .map((task) => this.getTaskConfig(task))
      .map((config) => config?.baseConfig?.nextBalanceConnectorId)
      .filter((connectors) => connectors !== undefined)

    for (const task of input) {
      const config = this.getTaskConfig(task)
      if (config) {
        const previous = config.baseConfig.previousBalanceConnectorId
        const isPreviousValid = previous == undefined || nextBalanceConnectors.includes(previous)
        if (!isPreviousValid) this.error(`Missing previous balance connector ${previous} for task ${task.name}`)

        const next = config.baseConfig.nextBalanceConnectorId
        const isNextValid = next == undefined || previousBalanceConnectors.includes(next)
        if (!isNextValid) this.error(`Missing next balance connector ${next} for task ${task.name}`)
      }
    }
  }

  private checkBridgeOrWithdrawTask(input: TaskParams[]): void {
    const isValid = input.some(({ config }) => isBridgeTaskConfig(config) || isWithdrawTaskConfig(config))
    if (!isValid) this.warn('Missing bridge or withdraw task')
  }

  private checkRelayerRelatedTask(input: TaskParams[]): void {
    const isValid = input.some(
      ({ version }) => typeof version != 'string' && version.id.startsWith('core/tasks/relayer')
    )
    if (!isValid) this.warn('Missing relayer-related task')
  }

  private checkPermissions(input: EnvironmentDeployment): void {
    const isExpectedAuthorizer = input.permissions.authorizer.id.startsWith(input.authorizer.name)
    if (!isExpectedAuthorizer) this.warn(`Permissions authorizer does not match`)

    for (const task of input.tasks) {
      const taskPermissions = input.permissions.changes
        .filter((permission) => input.smartVaults.some((smartVault) => permission.where.id.startsWith(smartVault.name)))
        .flatMap((permission) => permission.grants)
        .filter((grant) => typeof grant.who != 'string' && grant.who.id == task.name)

      const hasUpdateBalance = taskPermissions.some((grant) => grant.what == 'updateBalanceConnector')
      if (!hasUpdateBalance) this.error(`Task ${task.name} does not have updateBalanceConnector permission`)

      const hasPrimitivePermission = taskPermissions.some((grant) => PRIMITIVES.includes(grant.what))
      if (!hasPrimitivePermission) this.error(`Task ${task.name} does not have primitives permission`)

      const hasRelayerPermission = input.permissions.changes
        .filter((permission) => permission.where.id == task.name)
        .flatMap((permission) => permission.grants)
        .some((grant) => typeof grant.who != 'string' && grant.who.id.startsWith('core/relayer'))
      if (!hasRelayerPermission) this.error(`Task ${task.name} does not have relayer permissions`)
    }
  }

  private checkFeeSettings(input: EnvironmentDeployment): void {
    if (!this.isExpectedSmartVault(input, input.feeSettings)) this.warn('Unexpected fee settings smart vault')
    if (!input.feeSettings.feePct) this.error('Missing fee pct')
    if (!input.feeSettings.feeController.id.startsWith('core/fee-controller')) this.warn('Fee controller non core')
  }

  private checkRelayerSettings(input: EnvironmentDeployment): void {
    if (!input.relayerSettings) this.warn('Missing relayer settings')
    else {
      if (!this.isExpectedSmartVault(input, input.relayerSettings)) this.warn('Unexpected fee settings smart vault')
      if (!input.relayerSettings.relayer.id.startsWith('core/relayer')) this.warn('Unexpected fee controller')
    }
  }

  private isExpectedSmartVault(deployment: EnvironmentDeployment, input: { smartVault: Dependency | string }): boolean {
    if (typeof input.smartVault == 'string') return false
    return deployment.smartVaults.some((smartVault) => (input.smartVault as Dependency).id.startsWith(smartVault.name))
  }

  private checkNonDuplicatedNames(input: { name: string }[]): void {
    const encounteredNames = new Set<string>()
    for (const { name } of input) {
      if (encounteredNames.has(name)) this.error(`Duplicated name found: ${name}`)
      encounteredNames.add(name)
    }
  }

  private getTaskConfig(input: TaskParams): OptionalTaskConfig | undefined {
    if (isTaskConfig(input.config)) {
      return input.config
    } else if (isPrimitiveTaskConfig(input.config)) {
      return input.config.taskConfig
    } else if (isSwapTaskConfig(input.config)) {
      return input.config.baseSwapConfig.taskConfig
    } else if (isBridgeTaskConfig(input.config)) {
      return input.config.baseBridgeConfig.taskConfig
    } else if (isCurveTaskConfig(input.config)) {
      return input.config.baseCurveConfig.taskConfig
    } else if (isConvexTaskConfig(input.config)) {
      return input.config.baseConvexConfig.taskConfig
    } else {
      this.error(`Unknown task config for task ${input.name}`)
    }
  }

  private warn(message: string): void {
    this.warnings++
    logger.warn(message)
  }

  private error(message: string): void {
    this.errors++
    logger.error(message)
  }
}
