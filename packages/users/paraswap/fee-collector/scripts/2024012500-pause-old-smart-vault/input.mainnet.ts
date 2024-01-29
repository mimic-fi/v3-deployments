import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('old-authorizer'),
      changes: [
        {
          where: dependency('old-smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'pause', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('old-smart-vault'),
      method: 'pause',
      args: [],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('old-authorizer'),
      changes: [
        {
          where: dependency('old-smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'pause' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
