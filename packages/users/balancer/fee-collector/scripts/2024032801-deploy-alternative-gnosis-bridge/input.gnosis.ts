import { balanceConnectorId, dependency, DEPLOYER, EnvironmentUpdate, USERS_ADMIN } from '@mimic-fi/v3-deployments-lib'
import { bn, DAY, fp, tokens } from '@mimic-fi/v3-helpers'

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
}

//Config - Tokens
const USDC = tokens.gnosis.USDC
const USDC_THRESHOLD = bn(200000000) // 200 USDC

//Config - Addresses
const MAINNET_DEPOSITOR_TASK = '0xf0F516EFa40A1fD61d14B2164579FEdBf89E0d5E'

//Config - Bridge timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 14 * DAY //14 days
const BRIDGER_TIMELOCK_ALLOWED_AT = 1711612800 //2024-02-15 8:00 AM GMT
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    // Axelar - Bridger
    {
      from: DEPLOYER,
      name: 'axelar-bridger',
      version: dependency('core/tasks/bridge/axelar/v2.0.0'),
      config: {
        baseBridgeConfig: {
          connector: dependency('core/connectors/axelar/v1.0.0'),
          recipient: MAINNET_DEPOSITOR_TASK,
          destinationChain: 1, // mainnet
          maxSlippage: fp(0.02), //2%
          maxFee: {
            token: USDC,
            amount: fp(0.02), //2%
          },
          customDestinationChains: [],
          customMaxSlippages: [],
          customMaxFees: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency('2024011602-deploy-other-environments', 'smart-vault'),
              previousBalanceConnectorId: balanceConnectorId('bridger-connection'),
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
            },
            timeLockConfig: {
              mode: BRIDGER_TIMELOCK_MODE,
              frequency: BRIDGER_TIMELOCK_FREQUENCY,
              allowedAt: BRIDGER_TIMELOCK_ALLOWED_AT,
              window: BRIDGER_TIMELOCK_WINDOW,
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_THRESHOLD.mul(2),
                max: 0,
              },
            },
          },
        },
      },
    },
    {
      from: USERS_ADMIN,
      authorizer: dependency('2024011602-deploy-other-environments', 'authorizer'),
      changes: [
        {
          where: dependency('2024011602-deploy-other-environments', 'smart-vault'),
          revokes: [],
          grants: [
            {
              who: dependency('axelar-bridger'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('axelar-bridger'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('axelar-bridger'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
