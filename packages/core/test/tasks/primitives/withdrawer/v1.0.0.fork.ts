import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/primitives/withdrawer/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let withdrawer: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    withdrawer = await script.deployedInstance('Withdrawer')
  })

  it('registers the withdrawer in the registry correctly', async () => {
    expect(await registry.isRegistered(withdrawer.address)).to.be.true
    expect(await registry.isStateless(withdrawer.address)).to.be.false
    expect(await registry.isDeprecated(withdrawer.address)).to.be.false
  })
})
