import { OP } from '@mimic-fi/v3-authorizer'
import {
  assertEvent,
  assertIndirectEvent,
  deploy,
  deployFeedMock,
  deployProxy,
  deployTokenMock,
  fp,
  getSigners,
  ZERO_ADDRESS,
} from '@mimic-fi/v3-helpers'
import { buildEmptyTaskConfig, deployEnvironment, Mimic } from '@mimic-fi/v3-tasks'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract, ethers } from 'ethers'

/* eslint-disable no-secrets/no-secrets */

export default function itBehavesLikeAnAccountFunder(
  contractName: string,
  initFunction: string,
  executionType: string
): void {
  let task: Contract
  let account: string
  let smartVault: Contract, authorizer: Contract, priceOracle: Contract, connector: Contract, mimic: Mimic
  let owner: SignerWithAddress

  before('setup', async () => {
    // eslint-disable-next-line prettier/prettier
    ([, owner] = await getSigners())
    ;({ authorizer, smartVault, priceOracle, mimic } = await deployEnvironment(owner))
  })

  before('deploy connector', async () => {
    connector = await deploy('SwapConnectorMock')
    const overrideConnectorCheckRole = smartVault.interface.getSighash('overrideConnectorCheck')
    await authorizer.connect(owner).authorize(owner.address, smartVault.address, overrideConnectorCheckRole, [])
    await smartVault.connect(owner).overrideConnectorCheck(connector.address, true)
  })

  beforeEach('deploy task', async () => {
    account = ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)))
    task = await deployProxy(
      contractName,
      [],
      [
        {
          baseSwapConfig: {
            connector: connector.address,
            tokenOut: ZERO_ADDRESS,
            maxSlippage: 0,
            customTokensOut: [],
            customMaxSlippages: [],
            taskConfig: buildEmptyTaskConfig(owner, smartVault),
          },
        },
        account,
      ],
      initFunction
    )
  })

  describe('execution type', () => {
    it('defines it correctly', async () => {
      const expectedType = ethers.utils.solidityKeccak256(['string'], [executionType])
      expect(await task.EXECUTION_TYPE()).to.be.equal(expectedType)
    })
  })

  describe('initialization', async () => {
    it('cannot call parent initialize', async () => {
      await expect(
        task.initialize({
          baseSwapConfig: {
            connector: connector.address,
            tokenOut: ZERO_ADDRESS,
            maxSlippage: 0,
            customTokensOut: [],
            customMaxSlippages: [],
            taskConfig: buildEmptyTaskConfig(owner, smartVault),
          },
        })
      ).to.be.revertedWith('TaskInitializerDisabled')
    })

    it('has a account reference', async () => {
      expect(await task.account()).to.be.equal(account)
    })
  })

  describe('setAccount', () => {
    context('when the sender is authorized', () => {
      beforeEach('authorize sender', async () => {
        const setAccountRole = task.interface.getSighash('setAccount')
        await authorizer.connect(owner).authorize(owner.address, task.address, setAccountRole, [])
        task = task.connect(owner)
      })

      context('when the account is not zero', () => {
        it('sets the account', async () => {
          await task.setAccount(account)

          expect(await task.account()).to.be.equal(account)
        })

        it('emits an event', async () => {
          const tx = await task.setAccount(account)

          await assertEvent(tx, 'AccountSet', { account: account })
        })
      })

      context('when the account is zero', () => {
        it('reverts', async () => {
          await expect(task.setAccount(ZERO_ADDRESS)).to.be.revertedWith('TaskAccountZero')
        })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.setAccount(account)).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })

  describe('getTaskAmount', () => {
    let wrappedNT: string
    let fundingToken: Contract, thresholdToken: Contract
    let fundingThresholdRate: number

    beforeEach('set funding and wrapped native tokens', async () => {
      wrappedNT = await smartVault.wrappedNativeToken()
      fundingToken = await deployTokenMock('TKN')
    })

    const itComputesTaskAmountProperly = () => {
      const thresholdMin = fp(10)
      const thresholdMax = thresholdMin.mul(10)
      const thresholdNativeRate = 10 // 10 threshold tokens = 1 native token

      beforeEach('set threshold', async () => {
        const setDefaultTokenThresholdRole = task.interface.getSighash('setDefaultTokenThreshold')
        await authorizer.connect(owner).authorize(owner.address, task.address, setDefaultTokenThresholdRole, [])
        await task.connect(owner).setDefaultTokenThreshold(thresholdToken.address, thresholdMin, thresholdMax)
      })

      beforeEach('set price feed', async () => {
        const feed = await deployFeedMock(fp(thresholdNativeRate), 18)
        const setFeedRole = priceOracle.interface.getSighash('setFeed')
        await authorizer.connect(owner).authorize(owner.address, priceOracle.address, setFeedRole, [])
        await priceOracle.connect(owner).setFeed(wrappedNT, thresholdToken.address, feed.address)
      })

      context('when the account balance is below the min threshold', () => {
        const balance = thresholdMin.div(thresholdNativeRate).sub(1)

        beforeEach('set account balance', async () => {
          await owner.sendTransaction({ to: account, value: balance })
        })

        it('returns max threshold minus current balance', async () => {
          const taskAmount = await task.getTaskAmount(fundingToken.address)
          const expectedTaskAmount = thresholdMax.sub(balance.mul(thresholdNativeRate)).mul(fundingThresholdRate)
          expect(taskAmount).to.be.equal(expectedTaskAmount)
        })
      })

      context('when the balance is above the min threshold', () => {
        const balance = thresholdMin.div(thresholdNativeRate)

        beforeEach('set account balance', async () => {
          await owner.sendTransaction({ to: account, value: balance })
        })

        it('returns zero', async () => {
          expect(await task.getTaskAmount(fundingToken.address)).to.be.equal(0)
        })
      })
    }

    context('when threshold and funding token are different', () => {
      beforeEach('set threshold token', async () => {
        thresholdToken = await deployTokenMock('TKN')
        fundingThresholdRate = 2 // 2 `fundingToken` = 1 `thresholdToken`
      })

      beforeEach('set price feed', async () => {
        const feed = await deployFeedMock(fp(fundingThresholdRate), 18)
        const setFeedRole = priceOracle.interface.getSighash('setFeed')
        await authorizer.connect(owner).authorize(owner.address, priceOracle.address, setFeedRole, [])
        await priceOracle.connect(owner).setFeed(thresholdToken.address, fundingToken.address, feed.address)
      })

      itComputesTaskAmountProperly()
    })

    context('when threshold and funding token are the same', () => {
      beforeEach('set threshold token', async () => {
        thresholdToken = fundingToken
        fundingThresholdRate = 1 // 1 `fundingToken` = 1 `thresholdToken`
      })

      itComputesTaskAmountProperly()
    })
  })

  describe('call', () => {
    beforeEach('authorize task', async () => {
      const executeRole = smartVault.interface.getSighash('execute')
      const params = [{ op: OP.EQ, value: connector.address }]
      await authorizer.connect(owner).authorize(task.address, smartVault.address, executeRole, params)
    })

    context('when the sender is authorized', () => {
      beforeEach('set sender', async () => {
        const callRole = task.interface.getSighash('call')
        await authorizer.connect(owner).authorize(owner.address, task.address, callRole, [])
        task = task.connect(owner)
      })

      context('when the given token in is not zero', () => {
        let tokenIn: Contract
        const rateTokenInNative = 4 // 1 native = 4 token in

        beforeEach('deploy token in', async () => {
          tokenIn = await deployTokenMock('in')
        })

        beforeEach('set price feed', async () => {
          const feed = await deployFeedMock(fp(1).div(rateTokenInNative))
          const setFeedRole = priceOracle.interface.getSighash('setFeed')
          await authorizer.connect(owner).authorize(owner.address, priceOracle.address, setFeedRole, [])
          await priceOracle.connect(owner).setFeed(tokenIn.address, mimic.wrappedNativeToken.address, feed.address)
        })

        context('when there is a threshold set for the given token', () => {
          let thresholdToken: Contract
          const thresholdMin = fp(1)
          const thresholdMax = thresholdMin.mul(10)

          beforeEach('set default token threshold', async () => {
            thresholdToken = await deployTokenMock('threshold')
            const setDefaultTokenThresholdRole = task.interface.getSighash('setDefaultTokenThreshold')
            await authorizer.connect(owner).authorize(owner.address, task.address, setDefaultTokenThresholdRole, [])
            await task.connect(owner).setDefaultTokenThreshold(thresholdToken.address, thresholdMin, thresholdMax)
          })

          context('when there is a token out set', () => {
            let tokenOut: Contract // equal threshold token
            const rateTokenInTokenOut = 2 // 1 token out = 2 token in
            const rateTokenOutNative = rateTokenInNative / rateTokenInTokenOut
            const rateThresholdTokenNative = rateTokenOutNative

            beforeEach('set default token out', async () => {
              tokenOut = thresholdToken
              const setDefaultTokenOutRole = task.interface.getSighash('setDefaultTokenOut')
              await authorizer.connect(owner).authorize(owner.address, task.address, setDefaultTokenOutRole, [])
              await task.connect(owner).setDefaultTokenOut(tokenOut.address)
            })

            beforeEach('set price feed', async () => {
              const feed = await deployFeedMock(fp(1).div(rateTokenOutNative))
              const setFeedRole = priceOracle.interface.getSighash('setFeed')
              await authorizer.connect(owner).authorize(owner.address, priceOracle.address, setFeedRole, [])
              await priceOracle.connect(owner).setFeed(tokenOut.address, mimic.wrappedNativeToken.address, feed.address)
            })

            context('when the balance is below the min threshold', () => {
              const balance = thresholdMin.div(rateThresholdTokenNative).div(2)

              beforeEach('set smart vault balance in account', async () => {
                await owner.sendTransaction({ to: account, value: balance })
              })

              context('when the resulting balance is below the max threshold', () => {
                const amountIn = thresholdMax.sub(balance.mul(rateThresholdTokenNative)).mul(rateTokenInTokenOut)

                beforeEach('fund smart vault', async () => {
                  await tokenIn.mint(smartVault.address, amountIn)
                })

                context('when the slippage is below the limit', () => {
                  const data = '0xaabb'
                  const slippage = fp(0.01)
                  const expectedAmountOut = amountIn.div(rateTokenInTokenOut)
                  const minAmountOut = expectedAmountOut.mul(fp(1).sub(slippage)).div(fp(1))

                  beforeEach('set max slippage', async () => {
                    const setDefaultMaxSlippageRole = task.interface.getSighash('setDefaultMaxSlippage')
                    await authorizer
                      .connect(owner)
                      .authorize(owner.address, task.address, setDefaultMaxSlippageRole, [])
                    await task.connect(owner).setDefaultMaxSlippage(slippage)
                  })

                  it('executes the expected connector', async () => {
                    const tx = await task.call(tokenIn.address, amountIn, slippage, data)

                    const connectorData = connector.interface.encodeFunctionData('execute', [
                      tokenIn.address,
                      tokenOut.address,
                      amountIn,
                      minAmountOut,
                      data,
                    ])

                    await assertIndirectEvent(tx, smartVault.interface, 'Executed', {
                      connector,
                      data: connectorData,
                    })

                    await assertIndirectEvent(tx, connector.interface, 'LogExecute', {
                      tokenIn,
                      tokenOut,
                      amountIn,
                      minAmountOut,
                      data,
                    })
                  })

                  it('emits an Executed event', async () => {
                    const tx = await task.call(tokenIn.address, amountIn, slippage, data)

                    await assertEvent(tx, 'Executed')
                  })
                })

                context('when the slippage is above the limit', () => {
                  const slippage = fp(0.01)

                  it('reverts', async () => {
                    await expect(task.call(tokenIn.address, amountIn, slippage, '0x')).to.be.revertedWith(
                      'TaskSlippageAboveMax'
                    )
                  })
                })
              })

              context('when the resulting balance is above the max threshold', () => {
                const amountIn = thresholdMax.sub(balance.mul(rateThresholdTokenNative)).mul(rateTokenInTokenOut).add(1)

                it('reverts', async () => {
                  await expect(task.call(tokenIn.address, amountIn, 0, '0x')).to.be.revertedWith(
                    'TaskNewBalanceAboveMaxThreshold'
                  )
                })
              })
            })

            context('when the resulting balance is above the min threshold', () => {
              const balance = thresholdMin.div(rateThresholdTokenNative)

              beforeEach('set account balance', async () => {
                await owner.sendTransaction({ to: account, value: balance })
              })

              it('reverts', async () => {
                await expect(task.call(tokenIn.address, 0, 0, '0x')).to.be.revertedWith('TaskBalanceAboveMinThreshold')
              })
            })
          })

          context('when there is no token out set', () => {
            beforeEach('set price feed', async () => {
              const feed = await deployFeedMock(fp(1))
              const setFeedRole = priceOracle.interface.getSighash('setFeed')
              await authorizer.connect(owner).authorize(owner.address, priceOracle.address, setFeedRole, [])
              await priceOracle
                .connect(owner)
                .setFeed(thresholdToken.address, mimic.wrappedNativeToken.address, feed.address)
            })

            it('reverts', async () => {
              await expect(task.call(tokenIn.address, 0, 0, '0x')).to.be.revertedWith('TaskTokenOutNotSet')
            })
          })
        })

        context('when there is no threshold set for the given token', () => {
          it('reverts', async () => {
            await expect(task.call(tokenIn.address, 0, 0, '0x')).to.be.revertedWith('TaskTokenThresholdNotSet')
          })
        })
      })

      context('when the token in is the zero address', () => {
        const tokenIn = ZERO_ADDRESS

        it('reverts', async () => {
          await expect(task.call(tokenIn, 0, 0, '0x')).to.be.reverted
        })
      })
    })

    context('when the sender is not authorized', () => {
      it('reverts', async () => {
        await expect(task.call(ZERO_ADDRESS, 0, 0, '0x')).to.be.revertedWith('AuthSenderNotAllowed')
      })
    })
  })
}
