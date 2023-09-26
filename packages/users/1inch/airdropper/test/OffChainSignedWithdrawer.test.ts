import {
  assertEvent,
  assertIndirectEvent,
  assertNoEvent,
  BigNumberish,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment, Mimic } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

/* eslint-disable no-secrets/no-secrets */

describe('OffChainSignedWithdrawer', () => {
  let task: Contract
  let smartVault: Contract, authorizer: Contract, mimic: Mimic
  let owner: SignerWithAddress, signer: SignerWithAddress, recipient: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner, signer, recipient] = await getSigners())
    ;({ authorizer, smartVault, mimic } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    task = await deployProxy(
      'OffChainSignedWithdrawer',
      [],
      [
        {
          signer: signer.address,
          taskConfig: buildEmptyTaskConfig(owner, smartVault),
        },
      ]
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['OFF_CHAIN_SIGNED_WITHDRAWER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
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

          expect(await task.previousBalanceConnectorId()).to.be.equal(previous)
          expect(await task.nextBalanceConnectorId()).to.be.equal(next)

          await assertEvent(tx, 'BalanceConnectorsSet', { previous, next })
        })
      }

      context('when setting to non-zero', () => {
        const previous = '0x0000000000000000000000000000000000000000000000000000000000000001'

        context('when setting next to zero', () => {
          const next = ZERO_BYTES32

          itCanBeSet(previous, next)
        })

        context('when setting next to non-zero', () => {
          const next = '0x0000000000000000000000000000000000000000000000000000000000000002'

          it('reverts', async () => {
            await expect(task.setBalanceConnectors(previous, next)).to.be.revertedWith('TaskNextConnectorNotZero')
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

  describe('setSigner', () => {
    context('when the sender is authorized', async () => {
      beforeEach('set sender', async () => {
        const setSignerRole = task.interface.getSighash('setSigner')
        await authorizer.connect(owner).authorize(owner.address, task.address, setSignerRole, [])
        task = task.connect(owner)
      })

      context('when the new address is not zero', async () => {
        let newSigner: SignerWithAddress

        beforeEach('set new signer', async () => {
          newSigner = recipient
        })

        it('sets the signer', async () => {
          await task.setSigner(newSigner.address)
          expect(await task['signer()']()).to.be.equal(newSigner.address)
        })

        it('emits an event', async () => {
          const tx = await task.setSigner(newSigner.address)
          await assertEvent(tx, 'SignerSet', { signer: newSigner })
        })
      })

      context('when the new address is zero', async () => {
        const newSigner = ZERO_ADDRESS

        it('reverts', async () => {
          await expect(task.setSigner(newSigner)).to.be.revertedWith('TaskSignerZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.setSigner(ZERO_ADDRESS)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })

  describe('call', () => {
    let token: Contract
    const amount = fp(10)

    beforeEach('fund smart vault', async () => {
      token = await deployTokenMock('USDC')
      await token.mint(smartVault.address, amount)
    })

    beforeEach('authorize task', async () => {
      const withdrawRole = smartVault.interface.getSighash('withdraw')
      await authorizer.connect(owner).authorize(task.address, smartVault.address, withdrawRole, [])
    })

    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const callRole = task.interface.getSighash('call')
        await authorizer.connect(owner).authorize(owner.address, task.address, callRole, [])
        task = task.connect(owner)
      })

      context('when the given signature is valid', () => {
        let signature: string

        beforeEach('sign message', async () => {
          signature = await signer.signMessage(
            ethers.utils.arrayify(
              ethers.utils.solidityKeccak256(
                ['address', 'uint256', 'address'],
                [token.address, amount, recipient.address]
              )
            )
          )
        })

        const itExecutesTheTaskProperly = (requestedAmount: BigNumberish) => {
          it('calls the withdraw primitive', async () => {
            const previousFeeCollectorBalance = await token.balanceOf(mimic.feeCollector.address)

            const tx = await task.call(token.address, requestedAmount, recipient.address, signature)

            const currentFeeCollectorBalance = await token.balanceOf(mimic.feeCollector.address)
            const chargedFees = currentFeeCollectorBalance.sub(previousFeeCollectorBalance)

            await assertIndirectEvent(tx, smartVault.interface, 'Withdrawn', {
              token,
              recipient,
              amount: amount.sub(chargedFees),
              fee: chargedFees,
            })
          })

          it('emits an Executed event', async () => {
            const tx = await task.call(token.address, requestedAmount, recipient.address, signature)

            await assertEvent(tx, 'Executed')
          })
        }

        context('without balance connectors', () => {
          const requestedAmount = amount

          itExecutesTheTaskProperly(requestedAmount)

          it('does not update any balance connectors', async () => {
            const tx = await task.call(token.address, requestedAmount, recipient.address, signature)

            await assertNoEvent(tx, 'BalanceConnectorUpdated')
          })
        })

        context('with balance connectors', () => {
          const requestedAmount = 0
          const prevConnectorId = '0x0000000000000000000000000000000000000000000000000000000000000001'

          beforeEach('set balance connectors', async () => {
            const setBalanceConnectorsRole = task.interface.getSighash('setBalanceConnectors')
            await authorizer.connect(owner).authorize(owner.address, task.address, setBalanceConnectorsRole, [])
            await task.connect(owner).setBalanceConnectors(prevConnectorId, ZERO_BYTES32)
          })

          beforeEach('authorize task to update balance connectors', async () => {
            const updateBalanceConnectorRole = smartVault.interface.getSighash('updateBalanceConnector')
            await authorizer.connect(owner).authorize(task.address, smartVault.address, updateBalanceConnectorRole, [])
          })

          beforeEach('assign amount in to previous balance connector', async () => {
            const updateBalanceConnectorRole = smartVault.interface.getSighash('updateBalanceConnector')
            await authorizer.connect(owner).authorize(owner.address, smartVault.address, updateBalanceConnectorRole, [])
            await smartVault.connect(owner).updateBalanceConnector(prevConnectorId, token.address, amount, true)
          })

          itExecutesTheTaskProperly(requestedAmount)

          it('updates the balance connectors properly', async () => {
            const tx = await task.call(token.address, requestedAmount, recipient.address, signature)

            await assertIndirectEvent(tx, smartVault.interface, 'BalanceConnectorUpdated', {
              id: prevConnectorId,
              token,
              amount,
              added: false,
            })
          })
        })
      })

      context('when the given signature is invalid', () => {
        let signature: string

        beforeEach('sign message', async () => {
          signature = await owner.signMessage(
            ethers.utils.arrayify(
              ethers.utils.solidityKeccak256(
                ['address', 'uint256', 'address'],
                [token.address, amount, recipient.address]
              )
            )
          )
        })

        it('reverts', async () => {
          await expect(task.call(token.address, amount, recipient.address, signature)).to.be.revertedWith(
            'TaskInvalidOffChainSignedWithdrawer'
          )
        })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.call(token.address, 0, recipient.address, '0x')).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })
})
