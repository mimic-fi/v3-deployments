import { Script } from '@mimic-fi/v3-deployments-lib'
import { getForkedNetwork, tokens } from '@mimic-fi/v3-helpers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import hre from 'hardhat'

const script = Script.forForkedNetwork('smart-vault/v1.0.0-beta', hre)

describe(script.id, () => {
  let smartVault: Contract, registry: Contract, feeController: Contract

  before('deploy registry', async () => {
    const registryScript = Script.forForkedNetwork('registry/v1.0.0-beta', hre)
    await registryScript.run({ force: true })
    registry = await registryScript.deployedInstance('Registry')
  })

  before('deploy fee collector', async () => {
    const feeControllerScript = Script.forForkedNetwork('fee-controller/v1.0.0-beta', hre)
    await feeControllerScript.run({ force: true })
    feeController = await feeControllerScript.deployedInstance('FeeController')
  })

  before('run script', async () => {
    await script.run({ force: true })
    smartVault = await script.deployedInstance('SmartVault')
  })

  it('registers the smart vault in the registry correctly', async () => {
    expect(await registry.isRegistered(smartVault.address)).to.be.true
    expect(await registry.isStateless(smartVault.address)).to.be.false
    expect(await registry.isDeprecated(smartVault.address)).to.be.false
  })

  it('sets the registry properly', async () => {
    expect(await smartVault.registry()).to.be.equal(registry.address)
  })

  it('sets the fee collector properly', async () => {
    expect(await smartVault.feeController()).to.be.equal(feeController.address)
  })

  it('sets the wrapped native token address correctly', async () => {
    const getWrappedNativeToken = () => {
      const network = getForkedNetwork(hre)
      if (network === 'mainnet') return tokens.mainnet.WETH
      if (network === 'optimism') return tokens.optimism.WETH
      if (network === 'arbitrum') return tokens.arbitrum.WETH
      if (network === 'gnosis') return tokens.gnosis.WXDAI
      if (network === 'polygon') return tokens.polygon.WMATIC
      if (network === 'fantom') return tokens.fantom.WFTM
      if (network === 'avalanche') return tokens.avalanche.WAVAX
    }

    expect(await smartVault.wrappedNativeToken()).to.be.equal(getWrappedNativeToken())
  })
})
