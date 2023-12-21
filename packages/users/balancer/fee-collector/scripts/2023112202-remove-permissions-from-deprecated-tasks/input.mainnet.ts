import { dependency, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [
            {
              who: dependency('2023101700-environment-deploy', 'asset-collector'),
              what: 'call',
            },
            {
              who: dependency('2023101700-environment-deploy', 'asset-collector'),
              what: 'updateBalanceConnector',
            },
            {
              who: dependency('2023101700-environment-deploy', 'bpt-exiter'),
              what: 'call',
            },
            {
              who: dependency('2023101700-environment-deploy', 'bpt-exiter'),
              what: 'updateBalanceConnector',
            },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'asset-collector'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
