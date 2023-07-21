import { assertEvent, assertIndirectEvent, deployProxy, deployTokenMock, fp, getSigners } from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

describe('ExchangeAllocator', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract
  let owner: SignerWithAddress, funder: SignerWithAddress, allocationExchange: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner, funder, allocationExchange] = await getSigners())
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    task = await deployProxy(
      'ExchangeAllocator',
      [],
      [
        {
          tokensSource: funder.address,
          taskConfig: buildEmptyTaskConfig(owner, smartVault),
        },
        allocationExchange.address,
      ],
      'initializeExchangeAllocator'
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['COLLECTOR'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('call', () => {
    let token: Contract

    const min = fp(2)
    const max = fp(4)

    beforeEach('deploy token and allow smart vault', async () => {
      token = await deployTokenMock('GRT')
      await token.mint(funder.address, max.mul(2))
      await token.connect(funder).approve(smartVault.address, max.mul(2))
    })

    beforeEach('authorize task', async () => {
      const collectRole = smartVault.interface.getSighash('collect')
      await authorizer.connect(owner).authorize(task.address, smartVault.address, collectRole, [])
    })

    beforeEach('set default token threshold', async () => {
      const setDefaultTokenThresholdRole = task.interface.getSighash('setDefaultTokenThreshold')
      await authorizer.connect(owner).authorize(owner.address, task.address, setDefaultTokenThresholdRole, [])
      await task.connect(owner).setDefaultTokenThreshold(token.address, min, max)
    })

    beforeEach('allow sender', async () => {
      const callRole = task.interface.getSighash('call')
      await authorizer.connect(owner).authorize(owner.address, task.address, callRole, [])
      task = task.connect(owner)
    })

    context('when the current balance is below the min threshold', () => {
      beforeEach('set allocation exchange balance', async () => {
        await token.mint(allocationExchange.address, min.div(2))
      })

      it('computes the token amount correctly', async () => {
        const amount = await task.getTaskAmount(token.address)

        const allocationExchangeBalance = await token.balanceOf(allocationExchange.address)
        expect(amount).to.be.equal(max.sub(allocationExchangeBalance))
      })

      it('calls the collect primitive', async () => {
        const previousSmartVaultBalance = await token.balanceOf(smartVault.address)

        const amount = await task.getTaskAmount(token.address)
        const tx = await task.call(token.address, amount)

        const currentSmartVaultBalance = await token.balanceOf(smartVault.address)
        expect(currentSmartVaultBalance).to.be.equal(previousSmartVaultBalance.add(amount))

        await assertIndirectEvent(tx, smartVault.interface, 'Collected', {
          token,
          amount,
          from: funder.address,
        })
      })

      it('emits an Executed event', async () => {
        const amount = await task.getTaskAmount(token.address)
        const tx = await task.call(token.address, amount)

        await assertEvent(tx, 'Executed')
      })
    })

    context('when the current balance is above the min threshold', () => {
      beforeEach('set allocation exchange balance', async () => {
        await token.mint(allocationExchange.address, min)
      })

      it('computes the token amount correctly', async () => {
        const amount = await task.getTaskAmount(token.address)
        expect(amount).to.be.equal(0)
      })

      it('reverts', async () => {
        await expect(task.call(token.address, fp(1))).to.be.revertedWith('TASK_TOKEN_THRESHOLD_NOT_MET')
      })
    })
  })
})
