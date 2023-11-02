import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('authorizer/v1.1.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let authorizer: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    authorizer = await script.deployedInstance('Authorizer')
  })

  it('registers the authorizer in the registry correctly', async () => {
    expect(await registry.isRegistered(authorizer.address)).to.be.true
    expect(await registry.isStateless(authorizer.address)).to.be.false
    expect(await registry.isDeprecated(authorizer.address)).to.be.false
  })
})
