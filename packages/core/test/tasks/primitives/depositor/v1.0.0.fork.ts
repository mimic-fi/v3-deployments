import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/primitives/depositor/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let depositor: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    depositor = await script.deployedInstance('Depositor')
  })

  it('registers the depositor in the registry correctly', async () => {
    expect(await registry.isRegistered(depositor.address)).to.be.true
    expect(await registry.isStateless(depositor.address)).to.be.false
    expect(await registry.isDeprecated(depositor.address)).to.be.false
  })
})
