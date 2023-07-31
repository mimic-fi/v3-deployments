import path from 'path'

import { DEFAULT_SCRIPTS_DIRECTORY_NAME, Script } from './script'
import { Dependency, SolvedDependency } from './types'

export function dependency(id: string, key?: string): Dependency {
  return { id, key }
}

export function solveDependency(currentScript: Script, dependency: Dependency): SolvedDependency {
  const dependencyScript = fetchDependencyScript(currentScript, dependency)
  const key = validateDependencyKey(currentScript, dependencyScript, dependency)
  return { script: dependencyScript, key }
}

function fetchDependencyScript(currentScript: Script, dependency: Dependency): Script {
  if (dependency.id.indexOf('/') < 0) {
    if (!dependency.key) return currentScript
    return new Script(dependency.id, currentScript.directory, currentScript.inputNetwork, currentScript.outputNetwork)
  }

  const base = dependency.id.substring(0, dependency.id.indexOf('/'))
  const id = dependency.id.substring(dependency.id.indexOf('/') + 1)
  const directory = path.join(findPackagesDir(), base, DEFAULT_SCRIPTS_DIRECTORY_NAME)
  return new Script(id, directory, currentScript.inputNetwork, currentScript.outputNetwork)
}

function validateDependencyKey(currentScript: Script, dependencyScript: Script, dependency: Dependency): string {
  if (dependency.key) {
    const output = dependencyScript.output()[dependency.key]
    if (!output) throw Error(`Could not find key "${dependency.key}" in dependency "${dependencyScript.id}"`)
    return dependency.key
  } else {
    const outputs = dependencyScript.output()
    const keys = Object.keys(outputs)
    if (keys.length === 1 && currentScript != dependencyScript) return keys[0]
    else if (outputs[dependency.id]) return dependency.id
    throw Error(`Please specify dependency key for "${dependency.id}"`)
  }
}

function findPackagesDir(): string {
  let directory = __dirname
  for (let i = 0; i < 100 && !directory.endsWith('v3-deployments/packages'); i++) directory = path.join(directory, '..')
  if (!directory.endsWith('v3-deployments/packages')) throw Error('Could not find "packages" dir in root project')
  return directory
}
