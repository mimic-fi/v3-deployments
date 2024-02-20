import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const USDC = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven
const PROTOCOL_FEE_WITHDRAWER = '0xC6920d3a369E7c8BD1A22DbE385e11d1F7aF948F'
const USDC_THRESHOLD = bn(10000000) // 10 USDC
const TX_COST_LIMIT_PCT = fp(0.02) // 2%
const TOKENS = ['0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979', '0x04068da6c83afcfa0e13ba15a6696662335d5b75']

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: DEPLOYER,
      name: 'non-erc20-asset-collector',
      version: 'NonERC20BalancerClaimer',
      initialize: 'initializeNonERC20BalancerClaimer',
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
          acceptanceType: 1, //Allow list
          tokens: TOKENS,
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
              who: dependency('non-erc20-asset-collector'),
              what: 'call',
              params: [],
            },
            {
              who: dependency('non-erc20-asset-collector'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('non-erc20-asset-collector'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2023112801-deploy-new-asset-collector-task', 'asset-collector-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023112801-deploy-new-asset-collector-task', 'asset-collector-v2'),
      method: 'setTokensAcceptanceList',
      args: [TOKENS, [true, true]],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023112801-deploy-new-asset-collector-task', 'asset-collector-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
