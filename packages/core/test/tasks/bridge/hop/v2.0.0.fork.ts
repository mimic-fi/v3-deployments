import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/bridge/hop/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let hopBridger: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    hopBridger = await script.deployedInstance('HopBridger')
  })

  it('registers the hop bridger in the registry correctly', async () => {
    expect(await registry.isRegistered(hopBridger.address)).to.be.true
    expect(await registry.isStateless(hopBridger.address)).to.be.false
    expect(await registry.isDeprecated(hopBridger.address)).to.be.false
  })
})
