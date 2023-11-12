import {
  MIMIC_V2_BOT,
  MIMIC_V2_FEE_COLLECTOR,
  PROTOCOL_ADMIN,
  PROTOCOL_ADMIN_AURORA,
  Script,
} from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('relayer/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let relayer: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    relayer = await script.deployedInstance('Relayer')
  })

  it('registers the relayer in the registry correctly', async () => {
    expect(await registry.isRegistered(relayer.address)).to.be.true
    expect(await registry.isStateless(relayer.address)).to.be.false
    expect(await registry.isDeprecated(relayer.address)).to.be.false
  })

  it('sets the default fee collector properly', async () => {
    const collector = script.inputNetwork == 'aurora' ? PROTOCOL_ADMIN_AURORA.safe : MIMIC_V2_FEE_COLLECTOR.sv
    expect(await relayer.defaultCollector()).to.be.equal(collector)
  })

  it('sets the bot as an executor', async () => {
    expect(await relayer.isExecutorAllowed(MIMIC_V2_BOT.address)).to.be.true
  })

  it('sets the protocol multisig as the owner', async () => {
    const owner = (script.inputNetwork == 'aurora' ? PROTOCOL_ADMIN_AURORA : PROTOCOL_ADMIN).safe
    expect(await relayer.owner()).to.be.equal(owner)
  })
})
