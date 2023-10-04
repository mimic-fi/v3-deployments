import {
  balanceConnectorId,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { chainlink, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

const TOKEN = tokens.arbitrum.USDC
const ONE_INCH_OWNER = '0x979991695832F3321ad014564f1143A060cECE01'
const SIGNER = '0x979991695832F3321ad014564f1143A060cECE01'
const SIGNED_WITHDRAWALS_URL = 'https://gist.githubusercontent.com/dmf7z/f05eab8b4ffe74c374cc7a0947412ba9/raw/cfd8ac6572c03644c51844f747b151bdc5f2b2d1/airdrop.json'

const deployment: EnvironmentDeployment = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'the-graph',
  authorizer: {
    from: DEPLOYER,
    name: 'authorizer',
    version: dependency('core/authorizer/v1.0.0'),
    owners: [ONE_INCH_OWNER, USERS_ADMIN.safe],
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
  smartVault: {
    from: DEPLOYER,
    name: 'smart-vault',
    version: dependency('core/smart-vault/v1.0.0'),
    authorizer: dependency('authorizer'),
    priceOracle: dependency('price-oracle'),
  },
  tasks: [
    {
      from: DEPLOYER,
      name: 'depositor',
      version: dependency('core/tasks/primitives/depositor/v1.0.0'),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [TOKEN],
          },
        },
      },
    },
    {
      from: DEPLOYER,
      name: 'withdrawer',
      version: 'OffChainSignedWithdrawer',
      initialize: 'initialize',
      args: [SIGNER, SIGNED_WITHDRAWALS_URL],
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency('smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('withdrawer'),
          },
          gasLimitConfig: {
            gasPriceLimit: 10e9,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [TOKEN],
          },
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
          { who: dependency('depositor'), what: 'collect', params: [] },
          { who: dependency('depositor'), what: 'updateBalanceConnector', params: [] },
          { who: dependency('withdrawer'), what: 'withdraw', params: [] },
          { who: dependency('withdrawer'), what: 'updateBalanceConnector', params: [] },
        ],
      },
      {
        where: dependency('depositor'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.0.0'), what: 'call', params: [] }],
      },
      {
        where: dependency('withdrawer'),
        revokes: [],
        grants: [{ who: dependency('core/relayer/v1.0.0'), what: 'call', params: [] }],
      },
    ],
  },
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    feeController: dependency('core/fee-controller/v1.0.0'),
    maxFeePct: 0,
    feePct: 0,
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency('smart-vault'),
    relayer: dependency('core/relayer/v1.0.0'),
    quota: 0,
  },
}

export default deployment
