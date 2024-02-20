import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const USDC = '0x28a92dde19d9989f39a49905d7c9c2fac7799bdf' //USDC token by Beethoven
const WITHDRAWER_RECIPIENT = '0x693f30c37D5a0Db9258C636E93Ccf011ACd8c90c'
const WITHDRAW_THRESHOLD = bn(100) // 10 USDC
const TOKENS = [
  '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
  '0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979',
  '0xf386eb6780a1e875616b5751794f909095283860',
]

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: DEPLOYER,
      name: 'exceptions-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111100-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: TOKENS,
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: WITHDRAW_THRESHOLD,
              max: 0,
            },
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
              who: dependency('exceptions-withdrawer'),
              what: 'withdraw',
              params: [],
            },
            {
              who: dependency('exceptions-withdrawer'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('exceptions-withdrawer'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
