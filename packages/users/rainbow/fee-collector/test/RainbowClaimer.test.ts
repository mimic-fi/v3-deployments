import {
  assertEvent,
  assertIndirectEvent,
  assertNoEvent,
  bn,
  deploy,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumberish, Contract, ethers } from 'ethers'
import { ethers as ethershh } from 'hardhat'

describe('RainbowClaimer', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract, feeCollector: Contract
  let owner: SignerWithAddress, other: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    [, owner, other] = await getSigners()
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    feeCollector = await deploy('FeeCollectorMock')
    task = await deployProxy(
      'RainbowClaimer',
      [],
      [buildEmptyTaskConfig(owner, smartVault), feeCollector.address],
      'initializeRainbowClaimer'
    )
  })

  describe('execution type', () => {
    it('defines correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['RAINBOW_CLAIMER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('setFeeCollector', () => {
    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const setFeeCollectorRole = task.interface.getSighash('setFeeCollector')
        await authorizer.connect(owner).authorize(owner.address, task.address, setFeeCollectorRole, [])
        task = task.connect(owner)
      })

      context('when the given address is not zero', () => {
        it('sets the fee collector', async () => {
          await task.setFeeCollector(other.address)

          expect(await task.feeCollector()).to.be.equal(other.address)
        })

        it('emits an event', async () => {
          const tx = await task.setFeeCollector(other.address)

          await assertEvent(tx, 'FeeCollectorSet', { feeCollector: other })
        })
      })

      context('when the given address is zero', () => {
        it('reverts', async () => {
          await expect(task.setFeeCollector(ZERO_ADDRESS)).to.be.revertedWith('TaskFeeCollectorZero')
        })
      })
    })
  })

  describe('setBalanceConnectors', () => {
    context('when the sender is authorized', () => {
      beforeEach('authorize sender', async () => {
        const setBalanceConnectorsRole = task.interface.getSighash('setBalanceConnectors')
        await authorizer.connect(owner).authorize(owner.address, task.address, setBalanceConnectorsRole, [])
        task = task.connect(owner)
      })

      const itCanBeSet = (previous: string, next: string) => {
        it('can be set', async () => {
          const tx = await task.setBalanceConnectors(previous, next)

          const connectors = await task.getBalanceConnectors()
          expect(connectors.previous).to.be.equal(previous)
          expect(connectors.next).to.be.equal(next)

          await assertEvent(tx, 'BalanceConnectorsSet', { previous, next })
        })
      }

      context('when setting to non-zero', () => {
        const next = '0x0000000000000000000000000000000000000000000000000000000000000001'

        context('when setting previous to zero', () => {
          const previous = ZERO_BYTES32

          itCanBeSet(previous, next)
        })

        context('when setting previous to non-zero', () => {
          const previous = '0x0000000000000000000000000000000000000000000000000000000000000002'

          it('reverts', async () => {
            await expect(task.setBalanceConnectors(previous, next)).to.be.revertedWith('TaskPreviousConnectorNotZero')
          })
        })
      })

      context('when setting to zero', () => {
        const previous = ZERO_BYTES32
        const next = ZERO_BYTES32

        itCanBeSet(previous, next)
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

      context('when the token to claim is an ERC20', () => {
        let token: Contract

        beforeEach('deploy token', async () => {
          token = await deployTokenMock('TKN')
        })

        context('when the amount is greater than zero', () => {
          const totalBalance = fp(100)

          beforeEach('fund fee collector', async () => {
            await token.mint(feeCollector.address, totalBalance)
          })

          const itExecutesTheTaskProperly = (requestedAmount: BigNumberish) => {
            const transactedAmount = bn(requestedAmount).eq(0) ? totalBalance : requestedAmount

            it('calls the call primitive', async () => {
              const tx = await task.connect(owner).call(token.address, requestedAmount)

              const data = feeCollector.interface.encodeFunctionData('collectTokenFees', [
                token.address,
                transactedAmount,
              ])

              await assertIndirectEvent(tx, smartVault.interface, 'Called', {
                target: feeCollector,
                data,
                value: 0,
              })
            })

            it('transfers the token in from the fee collector to the receiver', async () => {
              const previousSmartVaultBalance = await token.balanceOf(smartVault.address)
              const previousFeesCollectorBalance = await token.balanceOf(feeCollector.address)

              await task.connect(owner).call(token.address, requestedAmount)

              const currentSmartVaultBalance = await token.balanceOf(smartVault.address)
              expect(currentSmartVaultBalance).to.be.eq(previousSmartVaultBalance.add(transactedAmount))

              const currentFeesCollectorBalance = await token.balanceOf(feeCollector.address)
              expect(currentFeesCollectorBalance).to.be.eq(previousFeesCollectorBalance.sub(transactedAmount))
            })

            it('emits an Executed event', async () => {
              const tx = await task.connect(owner).call(token.address, requestedAmount)

              await assertIndirectEvent(tx, task.interface, 'Executed')
            })
          }

          context('without balance connectors', () => {
            const requestedAmount = totalBalance.div(2)

            itExecutesTheTaskProperly(requestedAmount)

            it('does not update any balance connectors', async () => {
              const tx = await task.connect(owner).call(token.address, requestedAmount)

              await assertNoEvent(tx, 'BalanceConnectorUpdated')
            })
          })

          context('with balance connectors', () => {
            const requestedAmount = 0
            const nextConnectorId = '0x0000000000000000000000000000000000000000000000000000000000000002'

            beforeEach('set balance connectors', async () => {
              const setBalanceConnectorsRole = task.interface.getSighash('setBalanceConnectors')
              await authorizer.connect(owner).authorize(owner.address, task.address, setBalanceConnectorsRole, [])
              await task.connect(owner).setBalanceConnectors(ZERO_BYTES32, nextConnectorId)
            })

            beforeEach('authorize task to update balance connectors', async () => {
              const updateBalanceConnectorRole = smartVault.interface.getSighash('updateBalanceConnector')
              await authorizer
                .connect(owner)
                .authorize(task.address, smartVault.address, updateBalanceConnectorRole, [])
            })

            itExecutesTheTaskProperly(requestedAmount)

            it('updates the balance connectors properly', async () => {
              const tx = await task.connect(owner).call(token.address, requestedAmount)

              await assertIndirectEvent(tx, smartVault.interface, 'BalanceConnectorUpdated', {
                id: nextConnectorId,
                token,
                amount: totalBalance,
                added: true,
              })
            })
          })
        })

        context('when the amount is zero', () => {
          const amount = 0

          it('reverts', async () => {
            await expect(task.connect(owner).call(token.address, amount)).to.be.revertedWith('TaskAmountZero')
          })
        })
      })

      context('when the token is the native token', () => {
        const token = NATIVE_TOKEN_ADDRESS

        context('when the amount is not zero', () => {
          const totalBalance = fp(100)

          beforeEach('fund fee collector', async () => {
            await owner.sendTransaction({ to: feeCollector.address, value: totalBalance })
          })

          const itExecutesTheTaskProperly = (requestedAmount: BigNumberish) => {
            const transactedAmount = bn(requestedAmount).eq(0) ? totalBalance : requestedAmount

            it('calls the call primitive', async () => {
              const tx = await task.connect(owner).call(token, requestedAmount)

              const data = feeCollector.interface.encodeFunctionData('collectETHFees', [transactedAmount])

              await assertIndirectEvent(tx, smartVault.interface, 'Called', {
                target: feeCollector,
                data,
                value: 0,
              })
            })

            it('transfers the token in from the fee collector to the receiver', async () => {
              const previousSmartVaultBalance = await ethershh.provider.getBalance(smartVault.address)
              const previousFeesCollectorBalance = await ethershh.provider.getBalance(feeCollector.address)

              await task.connect(owner).call(token, requestedAmount)

              const currentSmartVaultBalance = await ethershh.provider.getBalance(smartVault.address)
              expect(currentSmartVaultBalance).to.be.eq(previousSmartVaultBalance.add(transactedAmount))

              const currentFeesCollectorBalance = await ethershh.provider.getBalance(feeCollector.address)
              expect(currentFeesCollectorBalance).to.be.eq(previousFeesCollectorBalance.sub(transactedAmount))
            })

            it('emits an Executed event', async () => {
              const tx = await task.connect(owner).call(token, requestedAmount)

              await assertIndirectEvent(tx, task.interface, 'Executed')
            })
          }

          context('without balance connectors', () => {
            const requestedAmount = totalBalance.div(2)

            itExecutesTheTaskProperly(requestedAmount)

            it('does not update any balance connectors', async () => {
              const tx = await task.connect(owner).call(token, requestedAmount)

              await assertNoEvent(tx, 'BalanceConnectorUpdated')
            })
          })

          context('with balance connectors', () => {
            const requestedAmount = 0
            const nextConnectorId = '0x0000000000000000000000000000000000000000000000000000000000000002'

            beforeEach('set balance connectors', async () => {
              const setBalanceConnectorsRole = task.interface.getSighash('setBalanceConnectors')
              await authorizer.connect(owner).authorize(owner.address, task.address, setBalanceConnectorsRole, [])
              await task.connect(owner).setBalanceConnectors(ZERO_BYTES32, nextConnectorId)
            })

            beforeEach('authorize task to update balance connectors', async () => {
              const updateBalanceConnectorRole = smartVault.interface.getSighash('updateBalanceConnector')
              await authorizer
                .connect(owner)
                .authorize(task.address, smartVault.address, updateBalanceConnectorRole, [])
            })

            itExecutesTheTaskProperly(requestedAmount)

            it('updates the balance connectors properly', async () => {
              const tx = await task.connect(owner).call(token, requestedAmount)

              await assertIndirectEvent(tx, smartVault.interface, 'BalanceConnectorUpdated', {
                id: nextConnectorId,
                token,
                amount: totalBalance,
                added: true,
              })
            })
          })
        })

        context('when the amount is zero', () => {
          const amount = 0

          it('reverts', async () => {
            await expect(task.connect(owner).call(token, amount)).to.be.revertedWith('TaskAmountZero')
          })
        })
      })

      context('when the token to claim is the zero address', () => {
        const token = ZERO_ADDRESS

        it('reverts', async () => {
          await expect(task.connect(owner).call(token, 1)).to.be.revertedWith('TaskTokenZero')
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
