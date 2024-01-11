import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */
const DEPOSITOR_TASK = '0x4b761eaeBAaba9FBE55273F1e88c4555182FA0F3'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setRecipient', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
      method: 'setRecipient',
      args: [DEPOSITOR_TASK],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'wormhole-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setRecipient' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
