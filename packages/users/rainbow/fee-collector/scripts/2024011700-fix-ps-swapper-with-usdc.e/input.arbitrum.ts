import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const USDC = tokens.arbitrum.USDC
const USDCe = tokens.arbitrum.USDCe

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setDefaultTokenOut',
      args: [USDCe],
    },
    {
      from: DEPLOYER,
      target: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
      method: 'setTokensAcceptanceList',
      args: [
        [USDC, USDCe],
        [false, true],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023121100-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenOut' }],
          grants: [],
        },
        {
          where: dependency('2024011601-deploy-ps-swapper-v2.1.0', 'paraswap-swapper-v2'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
