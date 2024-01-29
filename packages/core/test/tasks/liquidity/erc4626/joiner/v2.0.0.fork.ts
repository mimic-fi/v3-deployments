import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/liquidity/erc4626/joiner/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let joiner: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    joiner = await script.deployedInstance('ERC4626Joiner')
  })

  it('registers the ERC4626 joiner in the registry correctly', async () => {
    expect(await registry.isRegistered(joiner.address)).to.be.true
    expect(await registry.isStateless(joiner.address)).to.be.false
    expect(await registry.isDeprecated(joiner.address)).to.be.false
  })
})
