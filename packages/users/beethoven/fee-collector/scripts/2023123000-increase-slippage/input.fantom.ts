import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const SLIPPAGE = fp(0.1) //10%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultMaxSlippage', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultMaxSlippage', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', '1inch-swapper'),
      method: 'setDefaultMaxSlippage',
      args: [SLIPPAGE],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
      method: 'setDefaultMaxSlippage',
      args: [SLIPPAGE],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultMaxSlippage' }],
          grants: [],
        },
        {
          where: dependency('2023122701-deploy-new-ps-swapper', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultMaxSlippage' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
