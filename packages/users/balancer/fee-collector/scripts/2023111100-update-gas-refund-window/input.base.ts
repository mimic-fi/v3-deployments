import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

const WRAPPED_NATIVE_TOKEN = tokens.base.WETH
const QUOTA = fp(0.000135)
const MIN_WINDOW_GAS = QUOTA
const MAX_WINDOW_GAS = QUOTA.mul(10)

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
<<<<<<< HEAD
  namespace: 'balancer-fee-collector',
=======
  namespace: 'balancer-fee-collectoh',
>>>>>>> master
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [WRAPPED_NATIVE_TOKEN, MIN_WINDOW_GAS, MAX_WINDOW_GAS],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
