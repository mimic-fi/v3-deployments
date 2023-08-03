import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('price-oracle/v1.0.0', hre)

describe(script.id, () => {
  let priceOracle: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    priceOracle = await script.deployedInstance('PriceOracle')
  })

  it('registers the price oracle in the registry correctly', async () => {
    expect(await registry.isRegistered(priceOracle.address)).to.be.true
    expect(await registry.isStateless(priceOracle.address)).to.be.false
    expect(await registry.isDeprecated(priceOracle.address)).to.be.false
  })
})
