import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { fp, tokens } from '@mimic-fi/v3-helpers'

const USDC = tokens.bsc.USDC //18 decimals!!
const MAXFEE = fp(50)

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
          grants: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023122000-deploy-tasks', 'connext-bridger'),
      method: 'setDefaultMaxFee',
      args: [USDC, MAXFEE],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023122000-deploy-tasks', 'connext-bridger'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultMaxFee' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
