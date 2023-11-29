import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven

//Config - Addresses
const PROTOCOL_FEE_WITHDRAWER = '0xC6920d3a369E7c8BD1A22DbE385e11d1F7aF948F'

//Config - Threshold
const USDC_THRESHOLD = bn(10000000) // 10 USDC

//Config - Gas
const TX_COST_LIMIT_PCT = fp(0.02) // 2%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    //Asset Collector v2: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'BalancerClaimer',
      initialize: 'initializeBalancerClaimer',
      args: [PROTOCOL_FEE_WITHDRAWER, PROTOCOL_FEE_WITHDRAWER],
      config: {
        baseConfig: {
          smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
          nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
        },
        gasLimitConfig: {
          txCostLimitPct: TX_COST_LIMIT_PCT,
        },
        tokenIndexConfig: {
          acceptanceType: 0, //Deny list
          tokens: [],
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
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'smart-vault'),
          revokes: [],
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
          where: dependency('asset-collector-v2'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
