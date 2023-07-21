import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/1inch-v5/v1.0.0-beta', hre)

describe(script.id, () => {
  let oneInchV5Connector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0-beta', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    oneInchV5Connector = await script.deployedInstance('OneInchV5Connector')
  })

  it('registers the fee controller in the registry correctly', async () => {
    expect(await registry.isRegistered(oneInchV5Connector.address)).to.be.true
    expect(await registry.isStateless(oneInchV5Connector.address)).to.be.true
    expect(await registry.isDeprecated(oneInchV5Connector.address)).to.be.false
  })
})
