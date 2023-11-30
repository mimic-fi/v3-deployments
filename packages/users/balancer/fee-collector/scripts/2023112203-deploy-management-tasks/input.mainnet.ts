import {
  balanceConnectorId,
  dependency,
  DEPLOYER,
  EnvironmentUpdate,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'

const MANAGER = '0x049F945A4c62E16627206F7E969Fb26011530E82'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: DEPLOYER,
      name: 'management-withdrawer',
      version: dependency('core/tasks/primitives/withdrawer/v2.0.0'),
      config: {
        recipient: MANAGER,
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            previousBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('management-withdrawer'),
              what: 'withdraw',
              params: [],
            },
            {
              who: dependency('management-withdrawer'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('management-withdrawer'),
          revokes: [],
          grants: [{ who: MANAGER, what: 'call', params: [] }],
        },
      ],
    },
    {
      from: PROTOCOL_ADMIN,
      target: dependency('core/fee-controller/v1.0.0'),
      method: 'setFeePercentage',
      args: [dependency('2023101700-environment-deploy', 'smart-vault'), 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'depositor'),
          revokes: [],
          grants: [{ who: MANAGER, what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
