import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'the-graph',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensSource', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
      method: 'setTokensSource',
      args: ['0x095a77991EB4dC3727B6f8F95A08321cb2859C86'],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensSource' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
