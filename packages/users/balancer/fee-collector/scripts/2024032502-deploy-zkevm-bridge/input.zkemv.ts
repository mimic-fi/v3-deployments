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
const USDC = tokens.zkevm.USDC
const USDC_THRESHOLD = bn(200000000) // 200 USDC

//Config - Addresses
const MAINNET_DEPOSITOR_TASK = '0xC969B9f7909dC59421aBB220b6fA37131600D2B2'

//Config - Bridge timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 14 * DAY //14 days
const BRIDGER_TIMELOCK_ALLOWED_AT = 1711612800 //2024-02-15 8:00 AM GMT
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: 'balancer-fee-collector',
  steps: [
    //Symbiosis - Bridger
    {
      from: DEPLOYER,
      name: 'symbiosis-bridger',
      version: dependency('core/tasks/bridge/symbiosis/v2.0.0'),
      config: {
        baseBridgeConfig: {
          connector: dependency('core/connectors/symbiosis/v1.0.0'),
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
              smartVault: dependency('smart-vault'),
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
              who: dependency('symbiosis-bridger'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('symbiosis-bridger'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('symbiosis-bridger'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
      ],
    },
  ],
}

export default update
