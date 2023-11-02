import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/hop/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let hopConnector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    hopConnector = await script.deployedInstance('HopConnector')
  })

  it('registers the hop connector in the registry correctly', async () => {
    expect(await registry.isRegistered(hopConnector.address)).to.be.true
    expect(await registry.isStateless(hopConnector.address)).to.be.true
    expect(await registry.isDeprecated(hopConnector.address)).to.be.false
  })
})
