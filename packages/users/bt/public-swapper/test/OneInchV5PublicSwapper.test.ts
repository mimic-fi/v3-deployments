import { OP } from '@mimic-fi/v3-authorizer'
import {
  assertEvent,
  assertIndirectEvent,
  assertNoIndirectEvent,
  deploy,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment, Mimic } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { BigNumber, Contract } from 'ethers'
import { ethers } from 'hardhat'

/* eslint-disable no-secrets/no-secrets */

describe('OneInchV5PublicSwapper', () => {
  let task: Contract
  let owner: SignerWithAddress, user: SignerWithAddress
  let smartVault: Contract, authorizer: Contract, connector: Contract, mimic: Mimic

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner, user] = await getSigners())
    ;({ authorizer, smartVault, mimic } = await deployEnvironment(owner))
  })

  before('deploy connector', async () => {
    connector = await deploy('OneInchV5ConnectorMock')
    const overrideConnectorCheckRole = smartVault.interface.getSighash('overrideConnectorCheck')
    await authorizer.connect(owner).authorize(owner.address, smartVault.address, overrideConnectorCheckRole, [])
    await smartVault.connect(owner).overrideConnectorCheck(connector.address, true)
  })

  beforeEach('deploy task', async () => {
    task = await deployProxy(
      'OneInchV5PublicSwapper',
      [],
      [buildEmptyTaskConfig(owner, smartVault), connector.address],
      'initializePublicSwapper'
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], ['1INCH_V5_PUBLIC_SWAPPER'])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('setConnector', () => {
    let connector: Contract

    beforeEach('deploy connector', async () => {
      connector = await deployTokenMock('TKN')
    })

    context('when the sender is authorized', () => {
      beforeEach('authorize sender', async () => {
        const setConnectorRole = task.interface.getSighash('setConnector')
        await authorizer.connect(owner).authorize(owner.address, task.address, setConnectorRole, [])
        task = task.connect(owner)
      })

      it('sets the connector', async () => {
        await task.setConnector(connector.address)

        expect(await task.connector()).to.be.equal(connector.address)
      })

      it('emits an event', async () => {
        const tx = await task.setConnector(connector.address)

        await assertEvent(tx, 'ConnectorSet', { connector })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.setConnector(ZERO_ADDRESS)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })

  describe('call', () => {
    const data = '0xabcdef'

    beforeEach('authorize task', async () => {
      const executeParams = [{ op: OP.EQ, value: connector.address }]
      const grants = [
        { who: task.address, what: smartVault.interface.getSighash('collect'), params: [] },
        { who: task.address, what: smartVault.interface.getSighash('wrap'), params: [] },
        { who: task.address, what: smartVault.interface.getSighash('unwrap'), params: [] },
        { who: task.address, what: smartVault.interface.getSighash('withdraw'), params: [] },
        { who: task.address, what: smartVault.interface.getSighash('execute'), params: executeParams },
      ]
      await authorizer.connect(owner).changePermissions([{ where: smartVault.address, grants, revokes: [] }])
    })

    context('when the sender is allowed', () => {
      beforeEach('authorize user', async () => {
        const ANYONE = await authorizer.ANYONE()
        const callRole = task.interface.getSighash('call')
        await authorizer.connect(owner).authorize(ANYONE, task.address, callRole, [])
      })

      context('when the amount in is not zero', () => {
        const amountIn = fp(0.001)

        context('when the min amount out is not zero', () => {
          // This value is overwritten in case we deal with wrap/unwrap situations
          let minAmountOut: BigNumber
          const rate = fp(2)

          context('when the tokens are not zero', () => {
            let tokenIn: Contract | string, tokenOut: Contract | string

            const address = (token: Contract | string) => (typeof token === 'string' ? token : token.address)

            const call = () => {
              const value = typeof tokenIn === 'string' ? amountIn : 0
              return task
                .connect(user)
                .call(address(tokenIn), amountIn, address(tokenOut), minAmountOut, data, { value })
            }

            const getBalance = (account: SignerWithAddress | Contract, token: Contract | string) => {
              return typeof token === 'string'
                ? ethers.provider.getBalance(account.address)
                : token.balanceOf(account.address)
            }

            const itSendsTheExpectedAmountOutToTheSender = () => {
              it('sends the expected amount out to the sender', async () => {
                const previousBalance = await getBalance(user, tokenOut)

                const tx = await call()

                const feeData = await mimic.feeController.getFee(smartVault.address)
                const feeAmount = minAmountOut.mul(feeData.pct).div(fp(1))

                let expectedCurrentBalance = previousBalance.add(minAmountOut).sub(feeAmount)
                if (tokenOut === NATIVE_TOKEN_ADDRESS) {
                  const { gasUsed, effectiveGasPrice } = await tx.wait()
                  const txCost = gasUsed.mul(effectiveGasPrice)
                  expectedCurrentBalance = expectedCurrentBalance.sub(txCost)
                }

                const currentBalance = await getBalance(user, tokenOut)
                expect(currentBalance).to.be.equal(expectedCurrentBalance)
              })
            }

            const itLeavesTheSmartVaultEmpty = () => {
              it('leaves the smart vault empty', async () => {
                await call()

                expect(await getBalance(smartVault, tokenIn)).to.be.equal(0)
                expect(await getBalance(smartVault, tokenOut)).to.be.equal(0)
                expect(await getBalance(smartVault, NATIVE_TOKEN_ADDRESS)).to.be.equal(0)
                expect(await getBalance(smartVault, mimic.wrappedNativeToken)).to.be.equal(0)
              })
            }

            const itDoesNotCallPrimitive = (primitive: string) => {
              it(`does not call ${primitive}`, async () => {
                const tx = await call()
                await assertNoIndirectEvent(tx, smartVault.interface, primitive)
              })
            }

            const itCallsTheWrapPrimitive = () => {
              it('calls the wrap primitive', async () => {
                const tx = await call()
                await assertIndirectEvent(tx, smartVault.interface, 'Wrapped', { amount: amountIn })
              })
            }

            const itCallsTheUnwrapPrimitive = () => {
              it('calls the unwrap primitive', async () => {
                const tx = await call()
                await assertIndirectEvent(tx, smartVault.interface, 'Unwrapped', { amount: minAmountOut })
              })
            }

            const itCallsTheCollectPrimitive = () => {
              it('calls the collect primitive', async () => {
                const tx = await call()
                await assertIndirectEvent(tx, smartVault.interface, 'Collected', {
                  token: tokenIn,
                  from: user,
                  amount: amountIn,
                })
              })
            }

            const itCallsTheOneInchConnector = () => {
              it('calls the 1inch connector', async () => {
                const tx = await call()

                const connectorData = connector.interface.encodeFunctionData('execute', [
                  typeof tokenIn === 'string' ? mimic.wrappedNativeToken.address : tokenIn.address,
                  typeof tokenOut === 'string' ? mimic.wrappedNativeToken.address : tokenOut.address,
                  amountIn,
                  minAmountOut,
                  data,
                ])

                await assertIndirectEvent(tx, smartVault.interface, 'Executed', { connector, data: connectorData })
              })
            }

            const itCallsTheWithdrawPrimitive = () => {
              it('calls the withdraw primitive', async () => {
                const tx = await call()

                const feeData = await mimic.feeController.getFee(smartVault.address)
                const feeAmount = minAmountOut.mul(feeData.pct).div(fp(1))

                await assertIndirectEvent(tx, smartVault.interface, 'Withdrawn', {
                  token: tokenOut,
                  amount: minAmountOut.sub(feeAmount),
                  recipient: user,
                  fee: feeAmount,
                })
              })
            }

            const itReverts = (reason: string) => {
              it('reverts', async () => {
                await expect(call()).to.be.revertedWith(reason)
              })
            }

            context('when the token in is an ERC20', () => {
              beforeEach('deploy token and fund user', async () => {
                tokenIn = await deployTokenMock('IN')
                await tokenIn.mint(user.address, amountIn)
                await tokenIn.connect(user).approve(smartVault.address, amountIn)
              })

              context('when the token out is an ERC20', () => {
                beforeEach('deploy token and fund dex', async () => {
                  tokenOut = await deployTokenMock('OUT')
                  minAmountOut = amountIn.mul(rate).div(fp(1))

                  await connector.mockRate(rate)
                  await tokenOut.mint(await connector.dex(), minAmountOut)
                })

                itCallsTheCollectPrimitive()
                itCallsTheOneInchConnector()
                itDoesNotCallPrimitive('Wrapped')
                itDoesNotCallPrimitive('Unwrapped')
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })

              context('when the token out is the wrapped native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = mimic.wrappedNativeToken
                  minAmountOut = amountIn.mul(rate).div(fp(1))

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itCallsTheCollectPrimitive()
                itCallsTheOneInchConnector()
                itDoesNotCallPrimitive('Wrapped')
                itDoesNotCallPrimitive('Unwrapped')
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })

              context('when the token out is the native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = NATIVE_TOKEN_ADDRESS
                  minAmountOut = amountIn.mul(rate).div(fp(1))

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itCallsTheCollectPrimitive()
                itCallsTheOneInchConnector()
                itDoesNotCallPrimitive('Wrapped')
                itCallsTheUnwrapPrimitive()
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })
            })

            context('when the token in is the wrapped native token', () => {
              beforeEach('set token in and fund user', async () => {
                tokenIn = mimic.wrappedNativeToken
                await mimic.wrappedNativeToken.connect(owner).deposit({ value: amountIn })
                await mimic.wrappedNativeToken.connect(owner).transfer(user.address, amountIn)
                await mimic.wrappedNativeToken.connect(user).approve(smartVault.address, amountIn)
              })

              context('when the token out is an ERC20', () => {
                beforeEach('deploy token and fund dex', async () => {
                  tokenOut = await deployTokenMock('OUT')
                  minAmountOut = amountIn.mul(rate).div(fp(1))

                  await connector.mockRate(rate)
                  await tokenOut.mint(await connector.dex(), minAmountOut)
                })

                itCallsTheCollectPrimitive()
                itCallsTheOneInchConnector()
                itDoesNotCallPrimitive('Wrapped')
                itDoesNotCallPrimitive('Unwrapped')
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })

              context('when the token out is the wrapped native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = mimic.wrappedNativeToken
                  minAmountOut = amountIn

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itReverts('SwapSameTokens')
              })

              context('when the token out is the native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = NATIVE_TOKEN_ADDRESS
                  minAmountOut = amountIn

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itCallsTheCollectPrimitive()
                itDoesNotCallPrimitive('Wrapped')
                itDoesNotCallPrimitive('Executed')
                itCallsTheUnwrapPrimitive()
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })
            })

            context('when the token in is the native token', () => {
              beforeEach('set token in and fund user', async () => {
                tokenIn = NATIVE_TOKEN_ADDRESS
                await owner.sendTransaction({ to: user.address, value: amountIn })
              })

              context('when the token out is an ERC20', () => {
                beforeEach('deploy token and fund dex', async () => {
                  tokenOut = await deployTokenMock('OUT')
                  minAmountOut = amountIn.mul(rate).div(fp(1))

                  await connector.mockRate(rate)
                  await tokenOut.mint(await connector.dex(), minAmountOut)
                })

                itCallsTheWrapPrimitive()
                itCallsTheOneInchConnector()
                itDoesNotCallPrimitive('Collected')
                itDoesNotCallPrimitive('Unwrapped')
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })

              context('when the token out is the wrapped native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = mimic.wrappedNativeToken
                  minAmountOut = amountIn

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itCallsTheWrapPrimitive()
                itDoesNotCallPrimitive('Collected')
                itDoesNotCallPrimitive('Executed')
                itDoesNotCallPrimitive('Unwrapped')
                itCallsTheWithdrawPrimitive()
                itLeavesTheSmartVaultEmpty()
                itSendsTheExpectedAmountOutToTheSender()
              })

              context('when the token out is the native token', () => {
                beforeEach('set token out and fund dex', async () => {
                  tokenOut = NATIVE_TOKEN_ADDRESS
                  minAmountOut = amountIn

                  await connector.mockRate(rate)
                  await mimic.wrappedNativeToken.connect(owner).deposit({ value: minAmountOut })
                  await mimic.wrappedNativeToken.connect(owner).transfer(await connector.dex(), minAmountOut)
                })

                itReverts('SwapSameTokens')
              })
            })
          })

          context('when the tokens are zero', () => {
            it('reverts', async () => {
              await expect(
                task.call(ZERO_ADDRESS, amountIn, NATIVE_TOKEN_ADDRESS, minAmountOut, data)
              ).to.be.revertedWith('SwapTokenInZero')

              await expect(
                task.call(NATIVE_TOKEN_ADDRESS, amountIn, ZERO_ADDRESS, minAmountOut, data)
              ).to.be.revertedWith('SwapTokenOutZero')
            })
          })
        })

        context('when the min amount out is zero', () => {
          const minAmountOut = 0

          it('reverts', async () => {
            await expect(
              task.call(NATIVE_TOKEN_ADDRESS, amountIn, mimic.wrappedNativeToken.address, minAmountOut, data)
            ).to.be.revertedWith('SwapMinAmountOutZero')
          })
        })
      })

      context('when the amount in is zero', () => {
        const amountIn = 0

        it('reverts', async () => {
          await expect(
            task.call(NATIVE_TOKEN_ADDRESS, amountIn, mimic.wrappedNativeToken.address, 0, data)
          ).to.be.revertedWith('SwapAmountInZero')
        })
      })
    })

    context('when the sender is not allowed', () => {
      it('reverts', async () => {
        await expect(task.call(ZERO_ADDRESS, 0, ZERO_ADDRESS, 0, data)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })
})
