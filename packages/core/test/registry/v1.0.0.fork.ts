import { PROTOCOL_ADMIN, Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('registry/v1.0.0', hre)
const test = script.hasInput ? describe : describe.skip

test(script.id, () => {
  let registry: Contract

  before('run script', async () => {
    await script.run()
    registry = await script.deployedInstance('Registry')
  })

  it('sets the protocol multisig as the owner', async () => {
    expect(await registry.owner()).to.be.equal(PROTOCOL_ADMIN.safe)
  })
})
