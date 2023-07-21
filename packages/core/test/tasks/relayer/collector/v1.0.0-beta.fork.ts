import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/relayer/collector/v1.0.0-beta', hre)

describe(script.id, () => {
  let collector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0-beta', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    collector = await script.deployedInstance('CollectorRelayerFunder')
  })

  it('registers the collector relayer funder in the registry correctly', async () => {
    expect(await registry.isRegistered(collector.address)).to.be.true
    expect(await registry.isStateless(collector.address)).to.be.false
    expect(await registry.isDeprecated(collector.address)).to.be.false
  })
})
