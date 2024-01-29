import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.gnosis.USDC

//Config - Addresses
const SOURCE_SMART_VAULT = '0x94Dd9C6152a2A0BBcB52d3297b723A6F01D5F9f7'
const MIGRATION_TOKENS = [
  '0xd4015683b8153666190e0b2bec352580ebc4caca',
  '0x41211bba6d37f5a74b22e667533f080c7c7f3f13',
  '0xffff76a3280e95dc855696111c2562da09db2ac0',
]

//Config - Threshold
const USDC_THRESHOLD = bn(100000000) // 100 USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    //Migration Claimer: collect assets from v2 smart vault
    {
      from: DEPLOYER,
      name: 'migration-claimer-v3',
      version: 'MigrationClaimer',
      initialize: 'initializeMigrationClaimer',
      args: [SOURCE_SMART_VAULT],
      config: {
        baseConfig: {
          smartVault: dependency('2024011602-deploy-other-environments', 'smart-vault'),
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
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', 'smart-vault'),
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
          where: dependency('migration-claimer-v2'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
