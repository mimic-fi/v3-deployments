import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('deployer/v1.0.0', hre)

describe(script.id, () => {
  let deployer: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    deployer = await script.deployedInstance('Deployer')
  })

  it('registers the deployer in the registry correctly', async () => {
    expect(await registry.isRegistered(deployer.address)).to.be.true
    expect(await registry.isStateless(deployer.address)).to.be.false
    expect(await registry.isDeprecated(deployer.address)).to.be.false
  })

  it('keeps a reference to the registry', async () => {
    expect(await deployer.registry()).to.be.equal(registry.address)
  })
})
