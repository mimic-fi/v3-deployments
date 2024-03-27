import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */

//Config - Addresses
const FEE_CLAIMER = '0x000000009002f5D48013D49b0826CAa11F4070Ab'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'asset-collector'),
          grants: [{ who: DEPLOYER.address, what: 'setFeeClaimer', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'asset-collector'),
      method: 'setFeeClaimer',
      args: [FEE_CLAIMER],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'asset-collector'),
          revokes: [{ who: DEPLOYER.address, what: 'setFeeClaimer' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
