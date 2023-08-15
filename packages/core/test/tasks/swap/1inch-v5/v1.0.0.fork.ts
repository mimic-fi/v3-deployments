import { Script } from '@mimic-fi/v3-deployments-lib'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('tasks/swap/1inch-v5/v1.0.0', hre)

describe(script.id, () => {
  let oneInchV5Swapper: Contract, registry: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0', hre)
    await registryScript.run()
    registry = await registryScript.deployedInstance('Registry')
  })

  before('run script', async () => {
    await script.run()
    oneInchV5Swapper = await script.deployedInstance('OneInchV5Swapper')
  })

  it('registers the 1inch v5 swapper in the registry correctly', async () => {
    expect(await registry.isRegistered(oneInchV5Swapper.address)).to.be.true
    expect(await registry.isStateless(oneInchV5Swapper.address)).to.be.false
    expect(await registry.isDeprecated(oneInchV5Swapper.address)).to.be.false
  })
})
