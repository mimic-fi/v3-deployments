import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

const THE_GRAPH_FUNDER = '0xeDFEd47b96834338DFd71967Ab15AFaD4E7b7c2E'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'the-graph',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensSource', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensSource', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
      method: 'setTokensSource',
      args: [THE_GRAPH_FUNDER],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
      method: 'setTokensSource',
      args: [THE_GRAPH_FUNDER],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensSource' }],
          grants: [],
        },
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
