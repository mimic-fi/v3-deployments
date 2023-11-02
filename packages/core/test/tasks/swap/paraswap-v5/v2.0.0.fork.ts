import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/swap/paraswap-v5/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let paraswapV5Swapper: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    paraswapV5Swapper = await script.deployedInstance('ParaswapV5Swapper')
  })

  it('registers the paraswap v5 swapper in the registry correctly', async () => {
    expect(await registry.isRegistered(paraswapV5Swapper.address)).to.be.true
    expect(await registry.isStateless(paraswapV5Swapper.address)).to.be.false
    expect(await registry.isDeprecated(paraswapV5Swapper.address)).to.be.false
  })
})
