import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'

/* eslint-disable no-secrets/no-secrets */
const CONTRACT = '0xe6fab3f0c7199b0d34d7fbe83394fc0e0d06e99d'
const DATA =
  '0xed84313465786f64757377616c6c6574000000000000000000000000000000000000000000000000000000000000000060d1994b91cb8566de1b2200bdf8d94e9e76b267'

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'exodus-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'smart-vault'),
          grants: [{ who: DEPLOYER.address, what: 'call', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023121800-environment-deploy', 'smart-vault'),
      method: 'call',
      args: [CONTRACT, DATA, 0],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121800-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023121800-environment-deploy', 'smart-vault'),
          revokes: [{ who: DEPLOYER.address, what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
