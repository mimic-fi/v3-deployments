import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, NATIVE_TOKEN_ADDRESS } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TX_COST_LIMIT_PCT = fp(0.08) // 8%
const COLLECTOR = '0x965e2eff8cbd2f49702cfc863dca8acbd91c9ed9'
const SAFE = '0x69D6D375DE8c7ADE7e44446dF97f49E661fDAD7d'

//Denied tokens
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' //by Rainbow

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: 'asset-collector-v2',
      version: 'RainbowClaimer',
      initialize: 'initializeRainbowClaimer',
      args: [COLLECTOR, SAFE],
      config: {
        baseConfig: {
          smartVault: dependency('2023121100-environment-deploy', 'smart-vault'),
          nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
        },
        gasLimitConfig: {
          txCostLimitPct: TX_COST_LIMIT_PCT,
        },
        tokenIndexConfig: {
          acceptanceType: 0, //Deny list
          tokens: [NATIVE_TOKEN_ADDRESS, USDC],
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121100-environment-deploy', 'smart-vault'),
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
        {
          where: dependency('2024010200-deploy-claimer-tasks', 'asset-collector'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
