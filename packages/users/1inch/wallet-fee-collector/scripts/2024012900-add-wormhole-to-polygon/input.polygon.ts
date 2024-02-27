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
const USDC = tokens.polygon.USDC

//Config - Addresses
const MAINNET_DEPOSITOR_TASK = '0x3b2aDB502B3D83a1aF96ee583f122f0040023d4a'

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(10e6) // 10 USDC

//Config - Withdrawer Timelock
const BRIDGER_TIMELOCK_MODE = TIMELOCK_MODE.ON_LAST_DAY //SECONDS
const BRIDGER_TIMELOCK_FREQUENCY = 1 //1 month
const BRIDGER_TIMELOCK_ALLOWED_AT = 1704024000 //12:00hs UTC
const BRIDGER_TIMELOCK_WINDOW = 2 * DAY //2 days

const update: EnvironmentUpdate = {
  deployer: dependency('core/deployer/v1.0.0'),
  namespace: '1inch-wallet-fee-collector',
  steps: [
    //Bridger by time: makes sure that by the end of the period, it bridges everything
    {
      from: DEPLOYER,
      name: 'wormhole-bridger',
      version: dependency('core/tasks/bridge/wormhole/v2.0.0'),
      config: {
        baseBridgeConfig: {
          connector: dependency('core/connectors/wormhole/v1.0.0'),
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
              smartVault: dependency('2023111400-environment-deploy', 'smart-vault'),
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
                min: USDC_CONVERT_THRESHOLD.mul(2),
                max: 0,
              },
            },
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
              who: dependency('wormhole-bridger'),
              what: 'execute',
              params: [],
            },
            {
              who: dependency('wormhole-bridger'),
              what: 'updateBalanceConnector',
              params: [],
            },
          ],
        },
        {
          where: dependency('wormhole-bridger'),
          revokes: [],
          grants: [{ who: dependency('core/relayer/v1.1.0'), what: 'call', params: [] }],
        },
        {
          where: dependency('2023111400-environment-deploy', 'connext-bridger'),
          revokes: [{ who: dependency('core/relayer/v1.1.0'), what: 'call' }],
          grants: [],
        },
      ],
    },
  ],
}

export default update
