import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentUpdate,
  USERS_ADMIN,
} from '@mimic-fi/v3-deployments-lib'
import { fp } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TX_COST_LIMIT_PCT = fp(0.05) //5%

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'rainbow-fee-collector',
  steps: [
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: 'groundx-depositor',
      version: dependency('core/tasks/primitives/depositor/v2.1.0'),
      config: {
        tokensSource: counterfactualDependency('groundx-depositor'),
        taskConfig: {
          baseConfig: {
            smartVault: dependency('2023111400-environment-deploy', 'smart-vault'),
            nextBalanceConnectorId: balanceConnectorId('swapper-connection'),
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2023111400-environment-deploy', 'authorizer'),
      changes: [
        {
          where: dependency('2023111400-environment-deploy', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('groundx-depositor'),
              what: 'collect',
              params: [],
            },
            {
              who: dependency('groundx-depositor'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('groundx-depositor'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
