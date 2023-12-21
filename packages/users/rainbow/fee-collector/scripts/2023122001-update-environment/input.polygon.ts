import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */
const DEPOSITOR_TASK = '0x063F385990db1a69c4F16227B01D591E8428F7eD'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'connext-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setRecipient', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'connext-bridger'),
      method: 'setRecipient',
      args: [DEPOSITOR_TASK],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'connext-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setRecipient' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
