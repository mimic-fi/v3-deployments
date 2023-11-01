import {
  assertEvent,
  assertIndirectEvent,
  deploy,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ZERO_ADDRESS,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract, ethers } from 'ethers'

describe('BalancerClaimer', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract, protocolFeeWithdrawer: Contract
  let owner: SignerWithAddress, other: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner, other] = await getSigners())
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    protocolFeeWithdrawer = await deploy('ProtocolFeeWithdrawerMock')
    task = await deployProxy(
      'BalancerClaimer',
      [],
      [buildEmptyTaskConfig(owner, smartVault), protocolFeeWithdrawer.address],
      'initializeProtocolFeeWithdrawer'
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['BALANCER_CLAIMER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('setProtocolFeeWithdrawer', () => {
    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const setProtocolFeeWithdrawerRole = task.interface.getSighash('setProtocolFeeWithdrawer')
        await authorizer.connect(owner).authorize(owner.address, task.address, setProtocolFeeWithdrawerRole, [])
        task = task.connect(owner)
      })

      context('when the given address is not zero', () => {
        it('sets the swap signer', async () => {
          await task.setProtocolFeeWithdrawer(other.address)

          expect(await task.protocolFeeWithdrawer()).to.be.equal(other.address)
        })

        it('emits an event', async () => {
          const tx = await task.setProtocolFeeWithdrawer(other.address)

          await assertEvent(tx, 'ProtocolFeeWithdrawerSet', { protocolFeeWithdrawer: other })
        })
      })

      context('when the given address is zero', () => {
        it('reverts', async () => {
          await expect(task.setProtocolFeeWithdrawer(ZERO_ADDRESS)).to.be.revertedWith('TaskProtocolFeeWithdrawerZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      beforeEach('set sender', () => {
        task = task.connect(other)
      })

      it('reverts', async () => {
        await expect(task.setProtocolFeeWithdrawer(other.address)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })

  describe('call', () => {
    beforeEach('authorize task', async () => {
      const callRole = smartVault.interface.getSighash('call')
      await authorizer.connect(owner).authorize(task.address, smartVault.address, callRole, [])
    })

    context('when the sender is authorized', () => {
      beforeEach('authorize sender', async () => {
        const callRole = task.interface.getSighash('call')
        await authorizer.connect(owner).authorize(owner.address, task.address, callRole, [])
      })

      context('when the token to claim is not the address zero', () => {
        let token: Contract

        beforeEach('deploy token', async () => {
          token = await deployTokenMock('TKN')
        })

        context('when the amount is greater than zero', () => {
          const amount = fp(100)

          beforeEach('fund protocol fee withdrawer', async () => {
            await token.mint(protocolFeeWithdrawer.address, amount.mul(2))
          })

          it('calls the call primitive', async () => {
            const tx = await task.connect(owner).call(token.address, amount)

            const data = protocolFeeWithdrawer.interface.encodeFunctionData('withdrawCollectedFees', [
              [token.address],
              [amount],
              smartVault.address,
            ])

            await assertIndirectEvent(tx, smartVault.interface, 'Called', {
              target: protocolFeeWithdrawer,
              data,
              value: 0,
            })
          })

          it('transfers the token in from the protocol fee withdrawer to the smart vault', async () => {
            const previousSmartVaultBalance = await token.balanceOf(smartVault.address)
            const previousFeeWithdrawerBalance = await token.balanceOf(protocolFeeWithdrawer.address)

            await task.connect(owner).call(token.address, amount)

            const currentSmartVaultBalance = await token.balanceOf(smartVault.address)
            expect(currentSmartVaultBalance).to.be.eq(previousSmartVaultBalance.add(amount))

            const currentFeeWithdrawerBalance = await token.balanceOf(protocolFeeWithdrawer.address)
            expect(currentFeeWithdrawerBalance).to.be.eq(previousFeeWithdrawerBalance.sub(amount))
          })

          it('emits an Executed event', async () => {
            const tx = await task.connect(owner).call(token.address, amount)

            await assertIndirectEvent(tx, task.interface, 'Executed')
          })
        })

        context('when the amount is zero', () => {
          const amount = 0

          it('reverts', async () => {
            await expect(task.connect(owner).call(token.address, amount)).to.be.revertedWith('TaskAmountZero')
          })
        })
      })

      context('when the token to claim is the zero address', () => {
        const token = ZERO_ADDRESS

        it('reverts', async () => {
          await expect(task.connect(owner).call(token, 0)).to.be.revertedWith('TaskTokenZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.call(ZERO_ADDRESS, 0)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })
})
