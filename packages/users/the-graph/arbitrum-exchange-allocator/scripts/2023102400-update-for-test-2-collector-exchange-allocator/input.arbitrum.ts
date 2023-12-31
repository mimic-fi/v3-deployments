import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const THE_GRAPH_FUNDER = '0x43734F373Eb68bDabe0b89172d7da828219EF861'
const GRT = '0x9623063377ad1b27544c965ccd7342f7ea7e88c7'

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
          grants: [
            { who: DEPLOYER.address, what: 'setTokensSource', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
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
      target: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
      method: 'setDefaultTokenThreshold',
      args: [GRT, fp(25000), fp(100000)],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'collector-exchange-allocator'),
          revokes: [
            { who: DEPLOYER.address, what: 'setTokensSource' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
      ],
    },
  ],
}

export default update
