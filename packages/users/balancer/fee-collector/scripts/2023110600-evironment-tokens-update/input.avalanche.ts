import { dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, fp, tokens } from '@mimic-fi/v3-helpers'

const USDC = tokens.avalanche.USDC
const Token_Remove = tokens.avalanche.WETH
const Token_Add = tokens.avalanche.WAVAX

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collectoh',
  steps: [
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'asset-collector'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          grants: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] }],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          grants: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut', params: [] },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold', params: [] },
          ],
          revokes: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          grants: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList', params: [] }],
          revokes: [],
        },
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'asset-collector'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, bn(10000000), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'bpt-exiter'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, bn(10000000), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', '1inch-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [USDC, bn(10000000), 0],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setDefaultTokenOut',
      args: [Token_Add],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [Token_Add, Token_Remove],
        [true, false],
      ],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
      method: 'setDefaultTokenThreshold',
      args: [Token_Add, fp(0.005), fp(0.01)],
    },
    {
      from: DEPLOYER,
      target: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
      method: 'setTokensAcceptanceList',
      args: [
        [Token_Add, Token_Remove],
        [true, false],
      ],
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'asset-collector'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'bpt-exiter'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', '1inch-swapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setDefaultTokenThreshold' }],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-swapper'),
          revokes: [
            { who: DEPLOYER.address, what: 'setDefaultTokenOut' },
            { who: DEPLOYER.address, what: 'setTokensAcceptanceList' },
            { who: DEPLOYER.address, what: 'setDefaultTokenThreshold' },
          ],
          grants: [],
        },
        {
          where: dependency('2023101700-environment-deploy', 'relayer-funder-unwrapper'),
          revokes: [{ who: DEPLOYER.address, what: 'setTokensAcceptanceList' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
