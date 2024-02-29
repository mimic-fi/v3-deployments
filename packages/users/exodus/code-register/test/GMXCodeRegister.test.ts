import {
  assertEvent,
  assertIndirectEvent,
  assertNoEvent,
  deploy,
  deployProxy,
  getSigners,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract, ethers } from 'ethers'

describe('GMXCodeRegister', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract, referralStorage: Contract
  let owner: SignerWithAddress, other: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    [, owner, other] = await getSigners()
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    referralStorage = await deploy('ReferralStorageMock', [])
    task = await deployProxy(
      'GMXCodeRegister',
      [],
      [buildEmptyTaskConfig(owner, smartVault), referralStorage.address],
      'initializeGMXCodeRegister'
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['GMX_CODE_REGISTER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('setReferralStorage', () => {
    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const setReferralStorageRole = task.interface.getSighash('setReferralStorage')
        await authorizer.connect(owner).authorize(owner.address, task.address, setReferralStorageRole, [])
        task = task.connect(owner)
      })

      context('when the given address is not zero', () => {
        it('sets the protocol fee withdrawer', async () => {
          await task.setReferralStorage(other.address)

          expect(await task.referralStorage()).to.be.equal(other.address)
        })

        it('emits an event', async () => {
          const tx = await task.setReferralStorage(other.address)

          await assertEvent(tx, 'ReferralStorageSet', { referralStorage: other })
        })
      })

      context('when the given address is zero', () => {
        it('reverts', async () => {
          await expect(task.setReferralStorage(ZERO_ADDRESS)).to.be.revertedWith('TaskReferralStorageZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      beforeEach('set sender', () => {
        task = task.connect(other)
      })

      it('reverts', async () => {
        await expect(task.setReferralStorage(other.address)).to.be.revertedWith('AuthSenderNotAllowed')
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

      const itCannotBeSet = (previous: string, next: string, revertString: string) => {
        it('reverts', async () => {
          await expect(task.setBalanceConnectors(previous, next)).to.be.revertedWith(revertString)
        })
      }

      context('when setting to non-zero', () => {
        context('when setting previous to non-zero', () => {
          const previous = '0x0000000000000000000000000000000000000000000000000000000000000001'
          const next = ZERO_BYTES32

          itCannotBeSet(previous, next, 'TaskPreviousConnectorNotZero')
        })

        context('when setting next to non-zero', () => {
          const previous = ZERO_BYTES32
          const next = '0x0000000000000000000000000000000000000000000000000000000000000001'

          itCannotBeSet(previous, next, 'TaskNextConnectorNotZero')
        })

        context('when setting both to non-zero', () => {
          const previous = '0x0000000000000000000000000000000000000000000000000000000000000001'
          const next = '0x0000000000000000000000000000000000000000000000000000000000000002'

          itCannotBeSet(previous, next, 'TaskPreviousConnectorNotZero')
        })
      })

      context('when setting to zero', () => {
        const previous = ZERO_BYTES32
        const next = ZERO_BYTES32

        it('can be set', async () => {
          const tx = await task.setBalanceConnectors(previous, next)

          const connectors = await task.getBalanceConnectors()
          expect(connectors.previous).to.be.equal(previous)
          expect(connectors.next).to.be.equal(next)

          await assertEvent(tx, 'BalanceConnectorsSet', { previous, next })
        })
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

      context('when the code to register is not zero', () => {
        const code = '0x0000000000000000000000000000000000000000000000000000000000000001'

        it('calls the call primitive', async () => {
          const tx = await task.connect(owner).call(code)

          const data = referralStorage.interface.encodeFunctionData('registerCode', [code])

          await assertIndirectEvent(tx, smartVault.interface, 'Called', {
            target: referralStorage,
            data,
            value: 0,
          })
        })

        it('registers the code', async () => {
          const tx = await task.connect(owner).call(code)

          await assertIndirectEvent(tx, referralStorage.interface, 'CodeRegistered', { code })
        })

        it('emits an Executed event', async () => {
          const tx = await task.connect(owner).call(code)

          await assertIndirectEvent(tx, task.interface, 'Executed')
        })

        it('does not update any balance connectors', async () => {
          const tx = await task.connect(owner).call(code)

          await assertNoEvent(tx, 'BalanceConnectorUpdated')
        })
      })

      context('when the code is zero', () => {
        const code = ZERO_BYTES32

        it('reverts', async () => {
          await expect(task.connect(owner).call(code)).to.be.revertedWith('TaskCodeZero')
        })
      })
    })
  })

  context('when the sender is not authorized', () => {
    it('reverts', async () => {
      await expect(task.call(ZERO_BYTES32)).to.be.revertedWith('AuthSenderNotAllowed')
    })
  })
})
