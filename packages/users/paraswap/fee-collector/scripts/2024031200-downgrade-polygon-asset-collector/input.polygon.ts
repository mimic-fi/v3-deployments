import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' //USDC

//Config - Addresses
const FEE_CLAIMER = '0x000000009002f5D48013D49b0826CAa11F4070Ab'

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
      name: 'asset-collector',
      version: 'ParaswapClaimer',
      initialize: 'initializeParaswapClaimer',
      args: [FEE_CLAIMER],
      config: {
        baseConfig: {
          smartVault: dependency('2024022003-deploy-new-environments', 'smart-vault'),
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
      authorizer: dependency('2024022003-deploy-new-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024022003-deploy-new-environments', 'smart-vault'),
          revokes: [
            {
              who: dependency('2024022003-deploy-new-environments', 'asset-collector-v2'),
              what: 'call',
            },
            {
              who: dependency('2024022003-deploy-new-environments', 'asset-collector-v2'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [
            {
              who: dependency('asset-collector'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('asset-collector'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('2024022003-deploy-new-environments', 'asset-collector-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('asset-collector'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
