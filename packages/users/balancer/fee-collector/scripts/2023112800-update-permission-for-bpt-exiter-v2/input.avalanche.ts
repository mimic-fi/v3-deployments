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
              who: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
              what: 'call',
            },
          ],
          grants: [
            {
              who: dependency('2023101700-environment-deploy', 'bpt-exiter-v2'),
              what: 'execute',
              params: [],
            },
          ],
        },
      ],
    },
  ],
}

export default update
