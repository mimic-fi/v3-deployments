import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

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
          revokes: [{ who: dependency('2023101700-environment-deploy', 'cctp-bridger'), what: 'execute' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [
            { who: dependency('2023101700-environment-deploy', 'cctp-bridger'), what: 'updateBalanceConnector' },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'cctp-bridger'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
