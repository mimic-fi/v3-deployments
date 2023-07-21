import { PROTOCOL_ADMIN, Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('registry/v1.0.0-beta', hre)

describe(script.id, () => {
  let registry: Contract

  before('run script', async () => {
    await script.run({ force: true })
    registry = await script.deployedInstance('Registry')
  })

  it('registers the authorizer in the registry correctly', async () => {
    expect(await registry.owner()).to.be.equal(PROTOCOL_ADMIN.safe)
  })
})
