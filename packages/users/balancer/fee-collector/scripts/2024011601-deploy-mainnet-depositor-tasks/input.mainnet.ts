import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentUpdate,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */

//Config - Tokens
const USDC = tokens.mainnet.USDC

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    //Depositor: Arbitrum
    {
      from: DEPLOYER,
      name: 'arbitrum-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('arbitrum-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Gnosis
    {
      from: DEPLOYER,
      name: 'gnosis-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('gnosis-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Polygon
    {
      from: DEPLOYER,
      name: 'polygon-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('polygon-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: ZkEVM
    {
      from: DEPLOYER,
      name: 'zkevm-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('zkevm-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023101700-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('withdrawer-connection'),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023101700-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023101700-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('arbitrum-depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('arbitrum-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('gnosis-depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('gnosis-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('polygon-depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('polygon-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
            {
              who: dependency('zkevm-depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('zkevm-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('arbitrum-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('gnosis-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('polygon-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('zkevm-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
