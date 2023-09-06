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
          where: dependency('2023071500-environment-deploy', 'exchange-allocator-withdrawer'),
          grants: [{ who: DEPLOYER.address, what: 'setRecipient', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023071500-environment-deploy', 'exchange-allocator-withdrawer'),
      method: 'setRecipient',
      args: ['0x979991695832F3321ad014564f1143A060cECE01'],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023071500-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023071500-environment-deploy', 'exchange-allocator-withdrawer'),
          revokes: [{ who: DEPLOYER.address, what: 'setRecipient' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
