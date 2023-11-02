import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/relayer/1inch-v5-swapper/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let funder: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    funder = await script.deployedInstance('OneInchV5RelayerFunder')
  })

  it('registers the 1inch relayer funder in the registry correctly', async () => {
    expect(await registry.isRegistered(funder.address)).to.be.true
    expect(await registry.isStateless(funder.address)).to.be.false
    expect(await registry.isDeprecated(funder.address)).to.be.false
  })
})
