import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.optimism.USDC

//Config - Addresses
const SOURCE_SMART_VAULT = '0x94Dd9C6152a2A0BBcB52d3297b723A6F01D5F9f7'
const DEPOSITOR = '0xb62A12aEBe21f7538a55A63D1809dCE8Bb5DceC5'
const MIGRATION_TOKENS = [
  '0x004700ba0a4f5f22e1e78a277fca55e36f47e09c',
  '0x5f8893506ddc4c271837187d14a9c87964a074dc',
  '0x7e9250cc13559eb50536859e8c076ef53e275fb3',
]

//Config - Threshold
const USDC_THRESHOLD = bn(10e6) // 10 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    //Asset Collector v2: collect assets from external source
    {
      from: DEPLOYER,
      name: 'migration-claimer-v3',
      version: 'MigrationClaimer',
      initialize: 'initializeMigrationClaimer',
      args: [SOURCE_SMART_VAULT, DEPOSITOR],
      config: {
        baseConfig: {
          smartVault: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
          nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
        },
        tokenIndexConfig: {
          acceptanceType: 1, //Allow list
          tokens: MIGRATION_TOKENS,
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
      authorizer: dependency('2024011500-deploy-on-optimism', 'authorizer'),
      changes: [
        {
          where: dependency('2024011500-deploy-on-optimism', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('migration-claimer-v3'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('migration-claimer-v3'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('migration-claimer-v3'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2024011600-redeploy-migration-task', 'migration-claimer-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
