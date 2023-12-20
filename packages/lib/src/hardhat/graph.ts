import { ZERO_BYTES32 } from '@mimic-fi/v3-helpers'
import fs from 'fs'
import graphviz from 'graphviz'
import { task } from 'hardhat/config'

import logger, { Logger } from '../logger'
import { Script } from '../script'
import {
  EnvironmentDeployment,
  isEnvironmentDeployment,
  NETWORKS,
  ScriptInput,
  StandardTaskConfig,
  TaskParams,
} from '../types'
import {
  isBridgeTaskConfig,
  isConvexTaskConfig,
  isCurveTaskConfig,
  isPrimitiveTaskConfig,
  isSwapTaskConfig,
  isTaskConfig,
} from '../types/tasks/checks'

const IGNORED_NETWORKS = ['localhost', 'hardhat', 'goerli', 'mumbai']
const TRACKED_NETWORKS = NETWORKS.filter((network) => !IGNORED_NETWORKS.includes(network))

const CHAIN_COLORS: Record<string, string> = {
  mainnet: 'black',
  optimism: 'red',
  bsc: 'yellow',
  gnosis: 'green',
  polygon: 'purple',
  fantom: 'cyan',
  base: 'blue',
  arbitrum: 'grey',
  avalanche: 'firebrick',
  zkevm: 'darkorchid',
  aurora: 'midnightblue',
}

task('graph', 'Graph environment deploy')
  .addParam('id', 'Environment deploy task ID')
  .setAction(async (args: { id: string }) => {
    Logger.setDefaults(false, true)
    await generate(args.id)
  })

async function generate(scriptId: string): Promise<void> {
  const networks = filterNetworks(scriptId)
  const namespace = findNamespace(scriptId, networks)
  if (!namespace) return logger.error(`Could not find a environment deploy on script ${scriptId}`)

  const tasks = networks.map((network) => findTasks(scriptId, network))
  const graph = generateGraph(namespace, networks, tasks)
  fs.writeFileSync('graph.dot', graph.to_dot())
}

function filterNetworks(scriptId: string): string[] {
  return TRACKED_NETWORKS.filter((network) => {
    try {
      return Script.forNetwork(scriptId, network).hasInput
    } catch (error) {
      return false
    }
  })
}

function findNamespace(scriptId: string, networks: string[]): string | undefined {
  for (const network of networks) {
    const script = Script.forNetwork(scriptId, network)
    const input = script.input() as ScriptInput
    if (isEnvironmentDeployment(input)) {
      return input.namespace
    }
  }
}

function findTasks(scriptId: string, network: string): TaskParams[] {
  const script = Script.forNetwork(scriptId, network)
  const input = script.input() as EnvironmentDeployment
  return input.tasks
}

function generateGraph(namespace: string, networks: string[], tasks: TaskParams[][]): graphviz.Graph {
  const graph = graphviz.digraph(`"${namespace}"`)
  networks.forEach((network, i) => {
    if (tasks[i].length > 0) {
      const subgraph = graph.addCluster(network)
      const color = CHAIN_COLORS[network] || 'pink'
      tasks[i].forEach((task) => {
        const node = subgraph.addNode(`${network}_${task.name}`, { label: task.name, color })
        if (getBalanceConnector(task.config, false) !== ZERO_BYTES32) {
          const nextBalanceConnector = getBalanceConnector(task.config, false)
          const nextTasks = tasks[i].filter((t) => nextBalanceConnector === getBalanceConnector(t.config, true))
          nextTasks.forEach((nextTask) => subgraph.addEdge(node, `${network}_${nextTask.name}`, { color }))
        }
      })
    }
  })
  return graph
}

function getBalanceConnector(config: StandardTaskConfig, previous: boolean): string {
  let connectors: { previousBalanceConnectorId?: string; nextBalanceConnectorId?: string }

  if (isTaskConfig(config)) {
    connectors = config.baseConfig
  } else if (isPrimitiveTaskConfig(config)) {
    connectors = config.taskConfig.baseConfig
  } else if (isSwapTaskConfig(config)) {
    connectors = config.baseSwapConfig.taskConfig.baseConfig
  } else if (isBridgeTaskConfig(config)) {
    connectors = config.baseBridgeConfig.taskConfig.baseConfig
  } else if (isCurveTaskConfig(config)) {
    connectors = config.baseCurveConfig.taskConfig.baseConfig
  } else if (isConvexTaskConfig(config)) {
    connectors = config.baseConvexConfig.taskConfig.baseConfig
  } else {
    throw Error(`Unknown config type ${JSON.stringify(config)}`)
  }

  const connector = previous ? connectors.previousBalanceConnectorId : connectors.nextBalanceConnectorId
  return connector || ZERO_BYTES32
}
