import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.arbitrum.USDC

//Config - Addresses
const SOURCE_SMART_VAULT = '0x94Dd9C6152a2A0BBcB52d3297b723A6F01D5F9f7'
const MIGRATION_TOKENS = [
  '0x9cebf13bb702f253abf1579294694a1edad00eaa',
  '0xc6eee8cb7643ec2f05f46d569e9ec8ef8b41b389',
  '0x45c4d1376943ab28802b995acffc04903eb5223f',
  '0xbe0f30217be1e981add883848d0773a86d2d2cd4',
  '0xa3d1a8deb97b111454b294e2324efad13a9d8396',
  '0xa68ec98d7ca870cf1dd0b00ebbb7c4bf60a8e74d',
  '0xa0b862f60edef4452f25b4160f177db44deb6cf1',
  '0xa7997f0ec9fa54e89659229fb26537b6a725b798',
  '0x3fd4954a851ead144c2ff72b1f5a38ea5976bd54',
  '0x0c8972437a38b389ec83d1e666b69b8a4fcf8bfd',
  '0x9cebf13bb702f253abf1579294694a1edad00eaa',
  '0xc6eee8cb7643ec2f05f46d569e9ec8ef8b41b389',
  '0x45c4d1376943ab28802b995acffc04903eb5223f',
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
