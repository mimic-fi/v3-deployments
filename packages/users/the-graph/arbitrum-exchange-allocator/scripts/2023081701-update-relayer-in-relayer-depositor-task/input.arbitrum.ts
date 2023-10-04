import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'the-graph',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'relayer-depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setRelayer', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'relayer-depositor'),
      method: 'setRelayer',
      args: [dependency('core/relayer/v1.1.0')],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'relayer-depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setRelayer' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
