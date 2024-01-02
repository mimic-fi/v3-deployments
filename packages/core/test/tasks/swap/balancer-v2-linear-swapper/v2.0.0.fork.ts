import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/swap/balancer-v2-linear-swapper/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let balancerV2LinearSwapper: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    balancerV2LinearSwapper = await script.deployedInstance('BalancerV2LinearSwapper')
  })

  it('registers the balancer v2 linear swapper in the registry correctly', async () => {
    expect(await registry.isRegistered(balancerV2LinearSwapper.address)).to.be.true
    expect(await registry.isStateless(balancerV2LinearSwapper.address)).to.be.false
    expect(await registry.isDeprecated(balancerV2LinearSwapper.address)).to.be.false
  })
})
