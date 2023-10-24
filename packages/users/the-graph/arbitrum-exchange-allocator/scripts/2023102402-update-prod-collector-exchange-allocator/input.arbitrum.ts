import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const THE_GRAPH_ALLOCATION_EXCHANGE = '0x993F00C98D1678371a7b261Ed0E0D4b6F42d9aEE'

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
          grants: [{ who: DEPLOYER.address, what: 'setAllocationExchange', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
      method: 'setAllocationExchange',
      args: [THE_GRAPH_ALLOCATION_EXCHANGE],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
          revokes: [{ who: DEPLOYER.address, what: 'setAllocationExchange' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
