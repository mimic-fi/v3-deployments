import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/bridge/symbiosis/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let symbiosisBridger: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    symbiosisBridger = await script.deployedInstance('SymbiosisBridger')
  })

  it('registers the symbiosis bridger in the registry correctly', async () => {
    expect(await registry.isRegistered(symbiosisBridger.address)).to.be.true
    expect(await registry.isStateless(symbiosisBridger.address)).to.be.false
    expect(await registry.isDeprecated(symbiosisBridger.address)).to.be.false
  })
})
