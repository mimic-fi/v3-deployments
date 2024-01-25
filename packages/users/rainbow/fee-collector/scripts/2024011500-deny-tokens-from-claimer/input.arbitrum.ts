import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { NATIVE_TOKEN_ADDRESS } from '@mimic-fi/v3-helpers'

const USDC = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8' //by Rainbow

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024010200-deploy-claimer-tasks', 'asset-collector'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024010200-deploy-claimer-tasks', 'asset-collector'),
      method: 'setTokensAcceptanceList',
      args: [
        [NATIVE_TOKEN_ADDRESS, USDC],
        [true, true],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024010200-deploy-claimer-tasks', 'asset-collector'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
