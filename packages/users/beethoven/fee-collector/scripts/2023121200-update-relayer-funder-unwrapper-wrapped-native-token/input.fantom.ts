import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const WRAPPED_NATIVE_TOKEN_ADD = tokens.fantom.WFTM
const WRAPPED_NATIVE_TOKEN_REMOVE = tokens.fantom.WETH

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'beethoven-fee-collector-v3.0',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'relayer-funder-unwrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111100-environment-deploy', 'relayer-funder-unwrapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [WRAPPED_NATIVE_TOKEN_ADD, WRAPPED_NATIVE_TOKEN_REMOVE],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111100-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
