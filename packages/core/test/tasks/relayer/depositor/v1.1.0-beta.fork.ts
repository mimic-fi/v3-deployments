import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/relayer/depositor/v1.1.0-beta', hre)

describe(script.id, () => {
  let depositor: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0-beta', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    depositor = await script.deployedInstance('RelayerDepositor')
  })

  it('registers the relayer depositor in the registry correctly', async () => {
    expect(await registry.isRegistered(depositor.address)).to.be.true
    expect(await registry.isStateless(depositor.address)).to.be.false
    expect(await registry.isDeprecated(depositor.address)).to.be.false
  })
})
