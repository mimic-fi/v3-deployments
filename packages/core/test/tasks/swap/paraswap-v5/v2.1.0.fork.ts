import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const oldScript = Script.forForkedNetwork('tasks/swap/paraswap-v5/v2.0.0', hre)
const newScript = Script.forForkedNetwork('tasks/swap/paraswap-v5/v2.1.0', hre)
const test = newScript.hasInput ? describe : describe.skip

test(newScript.id, () => {
  let oldParaswapV5Swapper: Contract, newParaswapV5Swapper: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run old script', async () => {
    await oldScript.run()
    oldParaswapV5Swapper = await oldScript.deployedInstance('ParaswapV5Swapper')
  })

  before('run new script', async () => {
    await newScript.run()
    newParaswapV5Swapper = await newScript.deployedInstance('ParaswapV5Swapper')
  })

  it('registers the paraswap v5 swapper in the registry correctly', async () => {
    expect(await registry.isRegistered(newParaswapV5Swapper.address)).to.be.true
    expect(await registry.isStateless(newParaswapV5Swapper.address)).to.be.false
    expect(await registry.isDeprecated(newParaswapV5Swapper.address)).to.be.false
  })

  it('deprecates the paraswap v5 swapper previous version', async () => {
    expect(await registry.isRegistered(oldParaswapV5Swapper.address)).to.be.true
    expect(await registry.isStateless(oldParaswapV5Swapper.address)).to.be.false
    expect(await registry.isDeprecated(oldParaswapV5Swapper.address)).to.be.true
  })
})
