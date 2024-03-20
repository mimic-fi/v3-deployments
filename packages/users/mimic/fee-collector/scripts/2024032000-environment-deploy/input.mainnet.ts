import { OP } from '@mimic-fi/v3-authorizer'
import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { bn, chainlink, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

// Mimic addresses
//const DEPLOYER = '0x14c108d06244d664388db620df6a13dec0c97960'
const CLIENT_SV_OWNER = '0x996d7339f99290263e779d1f7afeac18e80d4c07'
const TESTING_EOA = '0x979991695832f3321ad014564f1143a060cece01'

//Config - Tokens
const USDC = tokens.mainnet.USDC
const WRAPPED_NATIVE_TOKEN = tokens.mainnet.WETH

//Config - Threshold
const USDC_THRESHOLD = bn(1000e6) // 1,000 USDC
const MIN_NATIVE_TOKEN = fp(0.3)
const MAX_NATIVE_TOKEN = fp(2)

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 100e9
const TX_COST_LIMIT_PCT = fp(0.05) // 5%
const TEN_TX_GAS = fp(0.0796) //10 tx
const QUOTA = TEN_TX_GAS.mul(10) //100 tx
const MIN_WINDOW_GAS = TEN_TX_GAS // 10 tx
const MAX_WINDOW_GAS = TEN_TX_GAS.mul(10) //100 tx

//Config - Fee
const FEE_PCT = fp(0) // 0%

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'mimic-fee-collector',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.1.0'),
    owners: [USERS_ADMIN.safe],
  },
  priceOracle: {
    from: DEPLOYER,
    name: 'price-oracle',
    version: dependency('core/price-oracle/v1.0.0'),
    authorizer: dependency('authorizer'),
    signer: MIMIC_V2_BOT.address,
    pivot: chainlink.denominations.USD,
    feeds: [],
  },
  smartVaults: [
    {
      from: DEPLOYER,
      name: 'smart-vault',
      version: dependency('core/smart-vault/v1.0.0'),
      authorizer: dependency('authorizer'),
      priceOracle: dependency('price-oracle'),
    },
  ],
  tasks: [
    /**
     *  Relayer Income
     */
    // Depositor
    {
      from: DEPLOYER,
      name: 'relayer-income-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('relayer-income-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('relayer-income-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: NATIVE_TOKEN_ADDRESS,
              min: fp(0.1),
              max: 0,
            },
          },
        },
      },
    },
    // Withdrawer
    {
      from: DEPLOYER,
      name: 'relayer-income-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: MIMIC_V2_BOT.address,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('relayer-income-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
        },
      },
    },
    /**
     *  Fee Handling
     */
    // Depositor
    {
      from: DEPLOYER,
      name: 'fee-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('fee-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('fee-swap-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
        },
      },
    },
    //1inch Swapper: swap assets using 1inch dex aggregator
    {
      from: DEPLOYER,
      name: '1inch-swapper',
      version: dependency('core/tasks/swap/1inch-v5/v2.0.0'),
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('fee-swap-connection'),
              nextBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper',
      version: dependency('core/tasks/swap/paraswap-v5/v2.0.0'),
      config: {
        quoteSigner: '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa',
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('fee-swap-connection'),
              nextBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Handle over: moves USDC to be bridged
    {
      from: DEPLOYER,
      name: 'usdc-handle-over',
      version: dependency('core/tasks/primitives/handle-over/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('fee-swap-connection'),
            nextBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: USDC_THRESHOLD,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Swapper for DEPLOYER
    {
      from: DEPLOYER,
      name: 'funder-deployer-swapper',
      version: 'OneInchV5AccountFunder',
      initialize: 'initializeOneInchV5AccountFunder',
      args: [DEPLOYER.address],
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
              nextBalanceConnectorId: balanceConnectorId('funder-deployer-unwrapper-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 1, //Allow list
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: WRAPPED_NATIVE_TOKEN,
                min: MIN_NATIVE_TOKEN,
                max: MAX_NATIVE_TOKEN,
              },
            },
          },
        },
      },
    },
    // Funder Unwrapper for DEPLOYER
    {
      from: DEPLOYER,
      name: 'funder-deployer-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-deployer-unwrapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('funder-deployer-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Withdrawer for DEPLOYER
    {
      from: DEPLOYER,
      name: 'funder-deployer-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: DEPLOYER.address,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-deployer-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Swapper for CLIENT_SV_OWNER
    {
      from: DEPLOYER,
      name: 'funder-sv-owner-swapper',
      version: 'OneInchV5AccountFunder',
      initialize: 'initializeOneInchV5AccountFunder',
      args: [CLIENT_SV_OWNER],
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
              nextBalanceConnectorId: balanceConnectorId('funder-sv-owner-unwrapper-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 1, //Allow list
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: WRAPPED_NATIVE_TOKEN,
                min: MIN_NATIVE_TOKEN,
                max: MAX_NATIVE_TOKEN,
              },
            },
          },
        },
      },
    },
    // Funder Unwrapper for CLIENT_SV_OWNER
    {
      from: DEPLOYER,
      name: 'funder-sv-owner-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-sv-owner-unwrapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('funder-sv-owner-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Withdrawer for CLIENT_SV_OWNER
    {
      from: DEPLOYER,
      name: 'funder-sv-owner-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: CLIENT_SV_OWNER,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-sv-owner-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Swapper for TESTING EOA
    {
      from: DEPLOYER,
      name: 'funder-testing-eoa-swapper',
      version: 'OneInchV5AccountFunder',
      initialize: 'initializeOneInchV5AccountFunder',
      args: [TESTING_EOA],
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
              nextBalanceConnectorId: balanceConnectorId('funder-testing-eoa-unwrapper-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 1, //Allow list
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: WRAPPED_NATIVE_TOKEN,
                min: MIN_NATIVE_TOKEN,
                max: MAX_NATIVE_TOKEN,
              },
            },
          },
        },
      },
    },
    // Funder Unwrapper for TESTING EOA
    {
      from: DEPLOYER,
      name: 'funder-testing-eoa-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-testing-eoa-unwrapper-connection'),
            nextBalanceConnectorId: balanceConnectorId('funder-testing-eoa-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    // Funder Withdrawer for TESTING EOA
    {
      from: DEPLOYER,
      name: 'funder-testing-eoa-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: TESTING_EOA,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('funder-testing-eoa-withdraw-connection'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: WRAPPED_NATIVE_TOKEN,
              min: MIN_NATIVE_TOKEN,
              max: 0,
            },
          },
        },
      },
    },
    /**
     *  Relayer Refunder
     */
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: 'relayer-funder-swapper',
      version: dependency('core/tasks/relayer/1inch-v5-swapper/v2.0.0'),
      initialize: 'initializeOneInchV5RelayerFunder',
      args: [dependency('core/relayer/v2.0.0')],
      config: {
        baseSwapConfig: {
          connector: dependency('core/connectors/1inch-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('usdc-holder-connection'),
              nextBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            },
            gasLimitConfig: {
              gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: WRAPPED_NATIVE_TOKEN,
                min: MIN_WINDOW_GAS,
                max: MAX_WINDOW_GAS,
              },
            },
          },
        },
      },
    },
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: 'relayer-funder-unwrapper',
      version: dependency('core/tasks/primitives/unwrapper/v2.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('relayer-funder-unwrapper'),
            nextBalanceConnectorId: balanceConnectorId('relayer-depositor'),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: 'relayer-depositor',
      version: dependency('core/tasks/relayer/depositor/v2.0.0'),
      args: [dependency('core/relayer/v2.0.0')],
      config: {
        baseConfig: {
          smartVault: dependency('smart-vault'),
          previousBalanceConnectorId: balanceConnectorId('relayer-depositor'),
        },
        gasLimitConfig: {
          gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
        },
        tokenIndexConfig: {
          acceptanceType: 1,
          tokens: [NATIVE_TOKEN_ADDRESS],
        },
      },
    },
  ],
  permissions: {
    from: USERS_ADMIN,
    authorizer: dependency('authorizer'),
    changes: [
      {
        where: dependency('smart-vault'),
        revokes: [],
        grants: [
          {
            who: dependency('relayer-income-depositor'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('relayer-income-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('relayer-income-withdrawer'),
            what: 'withdraw',
            params: [],
          },
          {
            who: dependency('relayer-income-withdrawer'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('fee-depositor'),
            what: 'collect',
            params: [],
          },
          {
            who: dependency('fee-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('1inch-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('1inch-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('paraswap-swapper'),
            what: 'execute',
            params: [],
          },
          {
            who: dependency('paraswap-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('usdc-handle-over'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-deployer-swapper'),
            what: 'execute',
            params: [
              {
                op: OP.EQ,
                value: dependency('core/connectors/1inch-v5/v1.0.0'),
              },
            ],
          },
          {
            who: dependency('funder-deployer-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-deployer-unwrapper'),
            what: 'unwrap',
            params: [],
          },
          {
            who: dependency('funder-deployer-unwrapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          { who: dependency('funder-deployer-withdrawer'), what: 'withdraw', params: [] },
          {
            who: dependency('funder-deployer-withdrawer'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-sv-owner-swapper'),
            what: 'execute',
            params: [
              {
                op: OP.EQ,
                value: dependency('core/connectors/1inch-v5/v1.0.0'),
              },
            ],
          },
          {
            who: dependency('funder-sv-owner-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-sv-owner-unwrapper'),
            what: 'unwrap',
            params: [],
          },
          {
            who: dependency('funder-sv-owner-unwrapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          { who: dependency('funder-sv-owner-withdrawer'), what: 'withdraw', params: [] },
          {
            who: dependency('funder-sv-owner-withdrawer'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-testing-eoa-swapper'),
            what: 'execute',
            params: [
              {
                op: OP.EQ,
                value: dependency('core/connectors/1inch-v5/v1.0.0'),
              },
            ],
          },
          {
            who: dependency('funder-testing-eoa-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('funder-testing-eoa-unwrapper'),
            what: 'unwrap',
            params: [],
          },
          {
            who: dependency('funder-testing-eoa-unwrapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          { who: dependency('funder-testing-eoa-withdrawer'), what: 'withdraw', params: [] },
          {
            who: dependency('funder-testing-eoa-withdrawer'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('relayer-funder-swapper'),
            what: 'execute',
            params: [
              {
                op: OP.EQ,
                value: dependency('core/connectors/1inch-v5/v1.0.0'),
              },
            ],
          },
          {
            who: dependency('relayer-funder-swapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          {
            who: dependency('relayer-funder-unwrapper'),
            what: 'unwrap',
            params: [],
          },
          {
            who: dependency('relayer-funder-unwrapper'),
            what: 'updateBalanceConnector',
            params: [],
          },
          { who: dependency('relayer-depositor'), what: 'call', params: [] },
          {
            who: dependency('relayer-depositor'),
            what: 'updateBalanceConnector',
            params: [],
          },
        ],
      },
      {
        where: dependency('relayer-income-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('relayer-income-withdrawer'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('fee-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('1inch-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('paraswap-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('usdc-handle-over'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-deployer-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-deployer-unwrapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-deployer-withdrawer'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-sv-owner-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-sv-owner-unwrapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-sv-owner-withdrawer'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-testing-eoa-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-testing-eoa-unwrapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('funder-testing-eoa-withdrawer'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('relayer-funder-swapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('relayer-funder-unwrapper'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('relayer-depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v2.0.0'), what: 'call', params: [] }],
      },
    ],
  },
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    feeController: dependency('core/fee-controller/v1.0.0'),
    maxFeePct: fp(0), // 0%
    feePct: FEE_PCT,
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    relayer: dependency('core/relayer/v2.0.0'),
    quota: QUOTA,
  },
}

export default deployment
