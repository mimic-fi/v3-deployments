import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp, NATIVE_TOKEN_ADDRESS, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.fantom.USDC
const WRAPPED_NATIVE_TOKEN = tokens.fantom.WFTM

//Config - Addresses
const PARASWAP_QUOTE_SIGNER = '0x6278c27cf5534f07fa8f1ab6188a155cb8750ffa'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(100e6) // 100 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.05) // 5%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Paraswap Swapper: swap assets using Paraswap dex aggregator
    {
      from: DEPLOYER,
      name: 'paraswap-swapper-v2',
      version: dependency('core/tasks/swap/paraswap-v5/v2.1.0'),
      config: {
        quoteSigner: PARASWAP_QUOTE_SIGNER,
        baseSwapConfig: {
          connector: dependency('core/connectors/paraswap-v5/v1.0.0'),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
              nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0, //Deny list
              tokens: [WRAPPED_NATIVE_TOKEN, NATIVE_TOKEN_ADDRESS],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_CONVERT_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
              what: 'execute',
            },
            {
              who: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('paraswap-swapper-v2'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('paraswap-swapper-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('paraswap-swapper-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
