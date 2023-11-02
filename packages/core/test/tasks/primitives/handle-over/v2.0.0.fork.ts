import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/primitives/handle-over/v2.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let handleOver: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    handleOver = await script.deployedInstance('HandleOver')
  })

  it('registers the handle-over task in the registry correctly', async () => {
    expect(await registry.isRegistered(handleOver.address)).to.be.true
    expect(await registry.isStateless(handleOver.address)).to.be.false
    expect(await registry.isDeprecated(handleOver.address)).to.be.false
  })
})
