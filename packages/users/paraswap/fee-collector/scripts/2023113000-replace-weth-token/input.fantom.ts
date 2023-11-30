import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

const OLD_WETH = tokens.fantom.WETH
const NEW_WETH = '0x695921034f0387eAc4e11620EE91b1b15A6A09fE' //ZeroLayer WETH

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'weth-handle-over'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'weth-handle-over'),
      method: 'setTokensAcceptanceList',
      args: [
        [NEW_WETH, OLD_WETH],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [NEW_WETH, OLD_WETH],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
      method: 'setDefaultTokenOut',
      args: [NEW_WETH],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [NEW_WETH, OLD_WETH],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [NEW_WETH, OLD_WETH],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111700-environment-deploy', 'weth-handle-over'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
          ],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'paraswap-weth-to-usdc-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
        {
          where: dependency('2023111700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
