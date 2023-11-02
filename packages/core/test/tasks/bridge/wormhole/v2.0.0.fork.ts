import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/bridge/wormhole/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let wormholeBridger: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    wormholeBridger = await script.deployedInstance('WormholeBridger')
  })

  it('registers the wormhole bridger in the registry correctly', async () => {
    expect(await registry.isRegistered(wormholeBridger.address)).to.be.true
    expect(await registry.isStateless(wormholeBridger.address)).to.be.false
    expect(await registry.isDeprecated(wormholeBridger.address)).to.be.false
  })
})
