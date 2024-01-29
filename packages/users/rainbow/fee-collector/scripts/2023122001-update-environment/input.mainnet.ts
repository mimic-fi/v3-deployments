import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */
const WITHDRAWER_RECIPIENT = '0x69d6d375de8c7ade7e44446df97f49e661fdad7d'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'withdrawer'),
          grants: [{ who: DEPLOYER.address, what: 'setRecipient', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'withdrawer'),
      method: 'setRecipient',
      args: [WITHDRAWER_RECIPIENT],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'withdrawer'),
          revokes: [{ who: DEPLOYER.address, what: 'setRecipient' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
