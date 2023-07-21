import { MIMIC_V2_FEE_COLLECTOR, PROTOCOL_ADMIN, Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('fee-controller/v1.0.0-beta', hre)

describe(script.id, () => {
  let feeController: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0-beta', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run({ force: true })
    feeController = await script.deployedInstance('FeeController')
  })

  it('registers the fee controller in the registry correctly', async () => {
    expect(await registry.isRegistered(feeController.address)).to.be.true
    expect(await registry.isStateless(feeController.address)).to.be.false
    expect(await registry.isDeprecated(feeController.address)).to.be.false
  })

  it('sets the default fee collector properly', async () => {
    expect(await feeController.defaultFeeCollector()).to.be.equal(MIMIC_V2_FEE_COLLECTOR.sv)
  })

  it('sets the protocol multisig as the owner', async () => {
    expect(await feeController.owner()).to.be.equal(PROTOCOL_ADMIN.safe)
  })
})
