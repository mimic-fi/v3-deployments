import { dependency, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

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
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
        {
          where: dependency('2023071500-environment-deploy', 'exchange-allocator-withdrawer'),
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
        {
          where: dependency('2023071500-environment-deploy', 'collector-relayer-funder'),
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
        {
          where: dependency('2023071500-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
        {
          where: dependency('2023071500-environment-deploy', 'relayer-funder-unwrapper'),
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
        {
          where: dependency('2023071500-environment-deploy', 'relayer-depositor'),
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
          revokes: [{ who: dependency('core/relayer/v1.0.0'), what: 'call' }],
        },
      ],
    },
  ],
}

export default update
