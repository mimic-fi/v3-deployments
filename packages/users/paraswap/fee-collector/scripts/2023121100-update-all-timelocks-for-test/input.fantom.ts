import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTimeLock', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'axelar-bridger'),
          grants: [{ who: DEPLOYER.address, what: 'setTimeLock', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
      method: 'setTimeLock',
      args: [0, 0, 0, 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'axelar-bridger'),
      method: 'setTimeLock',
      args: [0, 0, 0, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTimeLock' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'axelar-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setTimeLock' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
