import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/liquidity/balancer/bpt-exiter/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let bptExiter: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    bptExiter = await script.deployedInstance('BalancerBPTExiter')
  })

  it('registers the balancer BPT exiter in the registry correctly', async () => {
    expect(await registry.isRegistered(bptExiter.address)).to.be.true
    expect(await registry.isStateless(bptExiter.address)).to.be.false
    expect(await registry.isDeprecated(bptExiter.address)).to.be.false
  })
})
