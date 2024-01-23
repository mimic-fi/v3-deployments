import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */
const SAFE = '0x00000000009726632680FB29d3F7A9734E3010E2'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011702-deploy-fixed-claimer-tasks', 'asset-collector-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setSafe', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011702-deploy-fixed-claimer-tasks', 'asset-collector-v2'),
      method: 'setSafe',
      args: [SAFE],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011702-deploy-fixed-claimer-tasks', 'asset-collector-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setSafe' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
