import {
  assertEvent,
  assertIndirectEvent,
  BigNumberish,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ZERO_ADDRESS,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

/* eslint-disable no-secrets/no-secrets */

describe('ExchangeAllocator', () => {
  let task: Contract, smartVault: Contract, authorizer: Contract
  let owner: SignerWithAddress, tokensSource: SignerWithAddress, allocationExchange: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner, tokensSource, allocationExchange] = await getSigners())
    ;({ authorizer, smartVault } = await deployEnvironment(owner))
  })

  beforeEach('deploy task', async () => {
    task = await deployProxy(
      'ExchangeAllocator',
      [],
      [
        {
          tokensSource: tokensSource.address,
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
    beforeEach('authorize task', async () => {
      const collectRole = smartVault.interface.getSighash('collect')
      await authorizer.connect(owner).authorize(task.address, smartVault.address, collectRole, [])
    })

    context('when the sender is allowed', () => {
      beforeEach('allow sender', async () => {
        const callRole = task.interface.getSighash('call')
        await authorizer.connect(owner).authorize(owner.address, task.address, callRole, [])
        task = task.connect(owner)
      })

      context('when there is a threshold set', () => {
        let token: Contract
        const min = fp(2)
        const max = fp(4)

        beforeEach('set default token threshold', async () => {
          token = await deployTokenMock('GRT')
          const setDefaultTokenThresholdRole = task.interface.getSighash('setDefaultTokenThreshold')
          await authorizer.connect(owner).authorize(owner.address, task.address, setDefaultTokenThresholdRole, [])
          await task.connect(owner).setDefaultTokenThreshold(token.address, min, max)
        })

        context('when the current balance is below the min threshold', () => {
          const balance = min.sub(2)

          beforeEach('set allocation exchange balance', async () => {
            await token.mint(allocationExchange.address, balance)
          })

          it('computes the task amount correctly', async () => {
            const amount = await task.getTaskAmount(token.address)
            const allocationExchangeBalance = await token.balanceOf(allocationExchange.address)
            expect(amount).to.be.equal(max.sub(allocationExchangeBalance))
          })

          context('when the resulting balance is above the min threshold', () => {
            context('when the resulting balance is below the max threshold', () => {
              const itExecutesAsExpected = (requestedAmount: BigNumberish, expectedAmount = requestedAmount) => {
                it('calls the collect primitive', async () => {
                  const previousSmartVaultBalance = await token.balanceOf(smartVault.address)

                  const tx = await task.call(token.address, requestedAmount)

                  const currentSmartVaultBalance = await token.balanceOf(smartVault.address)
                  expect(currentSmartVaultBalance).to.be.equal(previousSmartVaultBalance.add(expectedAmount))

                  await assertIndirectEvent(tx, smartVault.interface, 'Collected', {
                    token,
                    amount: expectedAmount,
                    from: tokensSource.address,
                  })
                })

                it('emits an Executed event', async () => {
                  const tx = await task.call(token.address, requestedAmount)

                  await assertEvent(tx, 'Executed')
                })
              }

              context('when specifying an amount', () => {
                const amount = min.sub(balance)

                beforeEach('fund tokens source', async () => {
                  await token.mint(tokensSource.address, amount)
                  await token.connect(tokensSource).approve(smartVault.address, amount)
                })

                itExecutesAsExpected(amount)
              })

              context('when specifying no amount', () => {
                const expectedAmount = max.sub(balance)

                beforeEach('fund tokens source', async () => {
                  await token.mint(tokensSource.address, expectedAmount)
                  await token.connect(tokensSource).approve(smartVault.address, expectedAmount)
                })

                itExecutesAsExpected(0, expectedAmount)
              })
            })

            context('when the resulting balance is above the max threshold', () => {
              const amount = max.sub(balance).add(1)

              it('reverts', async () => {
                await expect(task.call(token.address, amount)).to.be.revertedWith('TaskNewAllocationBalanceAboveMax')
              })
            })
          })

          context('when the resulting balance is below the min threshold', () => {
            const amount = min.sub(balance).sub(1)

            it('reverts', async () => {
              await expect(task.call(token.address, amount)).to.be.revertedWith('TaskNewAllocationBalanceBelowMin')
            })
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
            await expect(task.call(token.address, 0)).to.be.revertedWith('TaskAllocationBalanceAboveMin')
          })
        })
      })

      context('when there is no a threshold set', () => {
        const token = ZERO_ADDRESS

        it('computes the token amount correctly', async () => {
          const amount = await task.getTaskAmount(token)
          expect(amount).to.be.equal(0)
        })

        it('reverts', async () => {
          await expect(task.call(token, 0)).to.be.revertedWith('TaskTokenThresholdNotSet')
        })
      })
    })

    context('when the sender is not allowed', () => {
      it('reverts', async () => {
        await expect(task.call(ZERO_ADDRESS, 0)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })
})
