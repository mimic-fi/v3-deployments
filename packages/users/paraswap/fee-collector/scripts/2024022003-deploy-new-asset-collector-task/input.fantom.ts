import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.fantom.USDC

//Config - Addresses
const FEE_CLAIMER = ''

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(100e6) // 100 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.05) // 5%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'ParaswapV6Claimer',
      initialize: 'initializeParaswapV6Claimer',
      args: [FEE_CLAIMER],
      config: {
        baseConfig: {
          smartVault: dependency('2023111700-environment-deploy', 'smart-vault'),
          nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
        },
        gasLimitConfig: {
          txCostLimitPct: TX_COST_LIMIT_PCT,
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
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023111700-environment-deploy', 'asset-collector'),
              what: 'call',
            },
            {
              who: dependency('2023111700-environment-deploy', 'asset-collector'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('asset-collector-v2'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('asset-collector-v2'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2023111700-environment-deploy', 'asset-collector'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('asset-collector-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
