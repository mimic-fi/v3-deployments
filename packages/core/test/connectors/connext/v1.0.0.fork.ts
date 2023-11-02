import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/connext/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let connextConnector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    connextConnector = await script.deployedInstance('ConnextConnector')
  })

  it('registers the connext connector in the registry correctly', async () => {
    expect(await registry.isRegistered(connextConnector.address)).to.be.true
    expect(await registry.isStateless(connextConnector.address)).to.be.true
    expect(await registry.isDeprecated(connextConnector.address)).to.be.false
  })
})
