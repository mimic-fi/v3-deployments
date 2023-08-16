import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/primitives/unwrapper/v1.0.0', hre)

describe(script.id, () => {
  let unwrapper: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    unwrapper = await script.deployedInstance('Unwrapper')
  })

  it('registers the unwrapper in the registry correctly', async () => {
    expect(await registry.isRegistered(unwrapper.address)).to.be.true
    expect(await registry.isStateless(unwrapper.address)).to.be.false
    expect(await registry.isDeprecated(unwrapper.address)).to.be.false
  })
})
