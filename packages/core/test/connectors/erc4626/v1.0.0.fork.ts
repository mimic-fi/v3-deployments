import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('connectors/erc4626/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let erc4626Connector: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    erc4626Connector = await script.deployedInstance('ERC2626Connector')
  })

  it('registers the erc4626 connector in the registry correctly', async () => {
    expect(await registry.isRegistered(erc4626Connector.address)).to.be.true
    expect(await registry.isStateless(erc4626Connector.address)).to.be.true
    expect(await registry.isDeprecated(erc4626Connector.address)).to.be.false
  })
})
