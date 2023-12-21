import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/balancer-v2-swap/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let balancerConnector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    balancerConnector = await script.deployedInstance('BalancerV2SwapConnector')
  })

  it('registers the balancer v2 swap connector in the registry correctly', async () => {
    expect(await registry.isRegistered(balancerConnector.address)).to.be.true
    expect(await registry.isStateless(balancerConnector.address)).to.be.true
    expect(await registry.isDeprecated(balancerConnector.address)).to.be.false
  })
})
