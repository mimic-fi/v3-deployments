import Table from 'cli-table'
import fs from 'fs'
import { task } from 'hardhat/config'
import path from 'path'

import { Script } from '../script'
import { NETWORKS } from '../types'

const SKIPPED_VERSIONS = ['v1.0.0']
const IGNORED_NETWORKS = ['localhost', 'hardhat', 'goerli', 'mumbai']
const TRACKED_NETWORKS = NETWORKS.filter((network) => !IGNORED_NETWORKS.includes(network))

type Result = { scriptId: string; missingNetworks: string[] }

task('pending', 'List pending deployments').setAction(async () => {
  const results: Result[] = []
  lookForPendingDeployments('scripts', results)
  printPendingDeployments(results)
})

function lookForPendingDeployments(dir: string, results: Result[]): void {
  const files = fs.readdirSync(dir)
  if (files.includes('output')) return trackPendingDeployments(dir, results)

  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) lookForPendingDeployments(filePath, results)
  }
}

function trackPendingDeployments(scriptPath: string, results: Result[]): void {
  const scriptId = scriptPath.substring(scriptPath.indexOf('/') + 1)
  const version = scriptId.substring(scriptId.lastIndexOf('/') + 1)
  if (SKIPPED_VERSIONS.includes(version)) return

  const outputPath = path.join(scriptPath, 'output')
  const files = fs.readdirSync(outputPath)
  const fileNames = files.map((file) => path.parse(file).name)
  const missingNetworks = TRACKED_NETWORKS.filter((network) => !fileNames.includes(network))
  results.push({ scriptId, missingNetworks })
}

function printPendingDeployments(results: Result[]): void {
  const middleAligns: Array<'middle'> = TRACKED_NETWORKS.map(() => 'middle')
  const colAligns: Array<'left' | 'middle'> = ['left', ...middleAligns]
  const colWidths = [70, ...TRACKED_NETWORKS.map(() => 12)]
  const table = new Table({ head: ['Script', ...TRACKED_NETWORKS], colAligns, colWidths })

  for (const result of results) {
    const row = [result.scriptId]
    for (const network of TRACKED_NETWORKS) {
      try {
        const script = Script.forNetwork(result.scriptId, network)
        if (script.hasInput && result.missingNetworks.includes(network)) row.push('🔴')
        else if (!script.hasInput && result.missingNetworks.includes(network)) row.push('🟠')
        else row.push('🟢')
      } catch (error) {
        row.push('⭕️')
      }
    }
    table.push(row)
  }

  console.log(table.toString() + '\n')
  console.log('⭕️ - Error parsing input')
  console.log('🔴 - Missing deployment')
  console.log('🟠 - No deployment defined')
  console.log('🟢 - Deployed')
  console.log('\nTotal results:', results.length)
}
