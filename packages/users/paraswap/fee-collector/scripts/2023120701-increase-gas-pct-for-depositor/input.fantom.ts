import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

const TX_COST_LIMIT_PCT = fp(0.1) // 10%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'paraswap-fee-collector-v3',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'depositor'),
          grants: [{ who: DEPLOYER.address, what: 'setGasLimits', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'depositor'),
      method: 'setGasLimits',
      args: [0, 0, 0, TX_COST_LIMIT_PCT],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'depositor'),
          revokes: [{ who: DEPLOYER.address, what: 'setGasLimits' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
