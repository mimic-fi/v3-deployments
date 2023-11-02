import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/wormhole/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let wormholeConnector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    wormholeConnector = await script.deployedInstance('WormholeConnector')
  })

  it('registers the wormhole connector in the registry correctly', async () => {
    expect(await registry.isRegistered(wormholeConnector.address)).to.be.true
    expect(await registry.isStateless(wormholeConnector.address)).to.be.true
    expect(await registry.isDeprecated(wormholeConnector.address)).to.be.false
  })
})
