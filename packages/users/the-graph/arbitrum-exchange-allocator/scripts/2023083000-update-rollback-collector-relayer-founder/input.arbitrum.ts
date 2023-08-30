import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const THE_GRAPH_FUNDER = '0x43734F373Eb68bDabe0b89172d7da828219EF861'

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
      args: [THE_GRAPH_FUNDER],
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
