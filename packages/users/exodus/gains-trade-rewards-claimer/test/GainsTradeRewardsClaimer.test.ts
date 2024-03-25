import {
  assertEvent,
  assertIndirectEvent,
  assertNoEvent,
  deploy,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ONES_ADDRESS,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract, ethers } from 'ethers'

describe('GainsTradeRewardsClaimer', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract, gnsMultiCollatDiamond: Contract, gnsToken: Contract
  let owner: SignerWithAddress, other: SignerWithAddress

  const pendingRewards = fp(100)

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    [, owner, other] = await getSigners()
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy GNS token', async () => {
    gnsToken = await deployTokenMock('GNS')
  })

  beforeEach('deploy task', async () => {
    gnsMultiCollatDiamond = await deploy('GNSMultiCollatDiamondMock', [pendingRewards, gnsToken.address])
    task = await deployProxy(
      'GainsTradeRewardsClaimer',
      [],
      [buildEmptyTaskConfig(owner, smartVault), gnsMultiCollatDiamond.address],
      'initializeGainsTradeRewardsClaimer'
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['GAINS_TRADE_REWARDS_CLAIMER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('setGnsMultiCollatDiamond', () => {
    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const setGnsMultiCollatDiamondRole = task.interface.getSighash('setGnsMultiCollatDiamond')
        await authorizer.connect(owner).authorize(owner.address, task.address, setGnsMultiCollatDiamondRole, [])
        task = task.connect(owner)
      })

      context('when the given address is not zero', () => {
        it('sets the GNS multi collat diamond', async () => {
          await task.setGnsMultiCollatDiamond(other.address)

          expect(await task.gnsMultiCollatDiamond()).to.be.equal(other.address)
        })

        it('emits an event', async () => {
          const tx = await task.setGnsMultiCollatDiamond(other.address)

          await assertEvent(tx, 'GnsMultiCollatDiamondSet', { gnsMultiCollatDiamond: other })
        })
      })

      context('when the given address is zero', () => {
        it('reverts', async () => {
          // eslint-disable-next-line no-secrets/no-secrets
          await expect(task.setGnsMultiCollatDiamond(ZERO_ADDRESS)).to.be.revertedWith('TaskGnsMultiCollatDiamondZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      beforeEach('set sender', () => {
        task = task.connect(other)
      })

      it('reverts', async () => {
        await expect(task.setGnsMultiCollatDiamond(other.address)).to.be.revertedWith('AuthSenderNotAllowed')
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

      context('when the token to claim is the GNS token', () => {
        context('when the amount is zero', () => {
          const amount = 0
          const totalBalance = pendingRewards

          beforeEach('fund GNS mutli collat diamond', async () => {
            await gnsToken.mint(gnsMultiCollatDiamond.address, totalBalance)
          })

          const itExecutesTheTaskProperly = () => {
            it('calls the call primitive', async () => {
              const tx = await task.connect(owner).call(gnsToken.address, amount)

              const data = gnsMultiCollatDiamond.interface.encodeFunctionData('claimReferrerRewards', [])

              await assertIndirectEvent(tx, smartVault.interface, 'Called', {
                target: gnsMultiCollatDiamond,
                data,
                value: 0,
              })
            })

            it('transfers the GNS token to the smart vault', async () => {
              const previousSmartVaultBalance = await gnsToken.balanceOf(smartVault.address)
              const previousFeesCollectorBalance = await gnsToken.balanceOf(gnsMultiCollatDiamond.address)

              await task.connect(owner).call(gnsToken.address, amount)

              const currentSmartVaultBalance = await gnsToken.balanceOf(smartVault.address)
              expect(currentSmartVaultBalance).to.be.eq(previousSmartVaultBalance.add(pendingRewards))

              const currentFeesCollectorBalance = await gnsToken.balanceOf(gnsMultiCollatDiamond.address)
              expect(currentFeesCollectorBalance).to.be.eq(previousFeesCollectorBalance.sub(pendingRewards))
            })

            it('emits an Executed event', async () => {
              const tx = await task.connect(owner).call(gnsToken.address, amount)

              await assertIndirectEvent(tx, task.interface, 'Executed')
            })
          }

          context('without balance connectors', () => {
            itExecutesTheTaskProperly()

            it('does not update any balance connectors', async () => {
              const tx = await task.connect(owner).call(gnsToken.address, amount)

              await assertNoEvent(tx, 'BalanceConnectorUpdated')
            })
          })

          context('with balance connectors', () => {
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

            itExecutesTheTaskProperly()

            it('updates the balance connectors properly', async () => {
              const tx = await task.connect(owner).call(gnsToken.address, amount)

              await assertIndirectEvent(tx, smartVault.interface, 'BalanceConnectorUpdated', {
                id: nextConnectorId,
                token: gnsToken,
                amount: totalBalance,
                added: true,
              })
            })
          })
        })

        context('when the amount is not zero', () => {
          const amount = 1

          it('reverts', async () => {
            await expect(task.connect(owner).call(gnsToken.address, amount)).to.be.revertedWith('TaskAmountNotZero')
          })
        })
      })

      context('when the token to claim is not the GNS token', () => {
        const token = ONES_ADDRESS

        it('reverts', async () => {
          await expect(task.connect(owner).call(token, 1)).to.be.revertedWith('TaskTokenNotGns')
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