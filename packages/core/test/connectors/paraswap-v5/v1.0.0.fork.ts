import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/paraswap-v5/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let paraswapV5Connector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    paraswapV5Connector = await script.deployedInstance('ParaswapV5Connector')
  })

  it('registers the paraswap v5 connector in the registry correctly', async () => {
    expect(await registry.isRegistered(paraswapV5Connector.address)).to.be.true
    expect(await registry.isStateless(paraswapV5Connector.address)).to.be.true
    expect(await registry.isDeprecated(paraswapV5Connector.address)).to.be.false
  })
})
