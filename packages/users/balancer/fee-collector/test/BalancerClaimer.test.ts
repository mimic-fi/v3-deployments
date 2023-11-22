import {
  assertEvent,
  assertIndirectEvent,
  assertNoEvent,
  BigNumberish,
  bn,
  deploy,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract, ethers } from 'ethers'

describe('BalancerClaimer', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract, protocolFeeWithdrawer: Contract
  let owner: SignerWithAddress, other: SignerWithAddress, protocolFeesCollector: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    [, owner, other, protocolFeesCollector] = await getSigners()
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    protocolFeeWithdrawer = await deploy('ProtocolFeeWithdrawerMock')
    task = await deployProxy(
      'BalancerClaimer',
      [],
      [buildEmptyTaskConfig(owner, smartVault), protocolFeeWithdrawer.address, protocolFeesCollector.address],
      'initializeBalancerClaimer'
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
        it('sets the protocol fee withdrawer', async () => {
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

  describe('setProtocolFeesCollector', () => {
    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const setProtocolFeesCollectorRole = task.interface.getSighash('setProtocolFeesCollector')
        await authorizer.connect(owner).authorize(owner.address, task.address, setProtocolFeesCollectorRole, [])
        task = task.connect(owner)
      })

      context('when the given address is not zero', () => {
        it('sets the protocol fees collector', async () => {
          await task.setProtocolFeesCollector(other.address)

          expect(await task.protocolFeesCollector()).to.be.equal(other.address)
          expect(await task.getTokensSource()).to.be.equal(other.address)
        })

        it('emits an event', async () => {
          const tx = await task.setProtocolFeesCollector(other.address)

          await assertEvent(tx, 'ProtocolFeesCollectorSet', { protocolFeesCollector: other })
        })
      })

      context('when the given address is zero', () => {
        it('reverts', async () => {
          await expect(task.setProtocolFeesCollector(ZERO_ADDRESS)).to.be.revertedWith('TaskProtocolFeesCollectorZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      beforeEach('set sender', () => {
        task = task.connect(other)
      })

      it('reverts', async () => {
        await expect(task.setProtocolFeesCollector(other.address)).to.be.revertedWith('AuthSenderNotAllowed')
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

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.setBalanceConnectors(ZERO_BYTES32, ZERO_BYTES32)).to.be.revertedWith('AuthSenderNotAllowed')
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
          const totalBalance = fp(100)

          beforeEach('fund protocol fee withdrawer', async () => {
            await token.mint(protocolFeeWithdrawer.address, totalBalance)
          })

          const itExecutesTheTaskProperly = (requestedAmount: BigNumberish) => {
            const transactedAmount = bn(requestedAmount).eq(0) ? totalBalance : requestedAmount

            it('calls the call primitive', async () => {
              const tx = await task.connect(owner).call(token.address, requestedAmount)

              const data = protocolFeeWithdrawer.interface.encodeFunctionData('withdrawCollectedFees', [
                [token.address],
                [transactedAmount],
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

              await task.connect(owner).call(token.address, requestedAmount)

              const currentSmartVaultBalance = await token.balanceOf(smartVault.address)
              expect(currentSmartVaultBalance).to.be.eq(previousSmartVaultBalance.add(transactedAmount))

              const currentFeeWithdrawerBalance = await token.balanceOf(protocolFeeWithdrawer.address)
              expect(currentFeeWithdrawerBalance).to.be.eq(previousFeeWithdrawerBalance.sub(transactedAmount))
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
