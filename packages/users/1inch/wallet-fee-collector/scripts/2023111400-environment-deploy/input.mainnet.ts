import { OP } from "@mimic-fi/v3-authorizer";
import {
  balanceConnectorId,
  counterfactualDependency,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from "@mimic-fi/v3-deployments-lib";
import {
  bn,
  chainlink,
  fp,
  NATIVE_TOKEN_ADDRESS,
  tokens,
  DAY,
} from "@mimic-fi/v3-helpers";

/* eslint-disable no-secrets/no-secrets */
const TIMELOCK_MODE = {
  SECONDS: 0,
  ON_DAY: 1,
  ON_LAST_DAY: 2,
  EVERY_X_MONTH: 3,
};

//Config - Tokens
const USDC = tokens.mainnet.USDC;
const WRAPPED_NATIVE_TOKEN = tokens.mainnet.WETH;

//Config - Addresses
const OWNER = "";
const WITHDRAWER_RECIPIENT = "";

//Config - Threshold
const USDC_CONVERT_THRESHOLD = bn(300000000); // 300 USDC

//Config - Gas
const STANDARD_GAS_PRICE_LIMIT = 100e9;
const TX_COST_LIMIT_PCT = fp(0.05); // 5%
const QUOTA = fp(0.0796);
const MIN_WINDOW_GAS = QUOTA;
const MAX_WINDOW_GAS = QUOTA.mul(7);

//Config - Withdrawer Timelock
const WITHDRAWER_TIMELOCK_MODE = TIMELOCK_MODE.ON_LAST_DAY; //SECONDS
const WITHDRAWER_TIMELOCK_FREQUENCY = 1; //1 month
const WITHDRAWER_TIMELOCK_ALLOWED_AT = 1701363600; //17:00hs UTC
const WITHDRAWER_TIMELOCK_WINDOW = 2 * DAY; //2 days

//Config - Fee
const FEE_PCT = fp(0.009); // 0.9%

const deployment: EnvironmentDeployment = {
  deployer: dependency("core/deployer/v1.0.0"),
  namespace: "1inch-wallet-fee-collector",
  authorizer: {
    from: DEPLOYER,
    name: "authorizer",
    version: dependency("core/authorizer/v1.1.0"),
    owners: [OWNER, USERS_ADMIN.safe],
  },
  priceOracle: {
    from: DEPLOYER,
    name: "price-oracle",
    version: dependency("core/price-oracle/v1.0.0"),
    authorizer: dependency("authorizer"),
    signer: MIMIC_V2_BOT.address,
    pivot: chainlink.denominations.USD,
    feeds: [],
  },
  smartVault: {
    from: DEPLOYER,
    name: "smart-vault",
    version: dependency("core/smart-vault/v1.0.0"),
    authorizer: dependency("authorizer"),
    priceOracle: dependency("price-oracle"),
  },
  tasks: [
    //Depositor: Arbitrum
    {
      from: DEPLOYER,
      name: "arbitrum-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("arbitrum-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Avalanche
    {
      from: DEPLOYER,
      name: "avalanche-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("avalanche-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Base
    {
      from: DEPLOYER,
      name: "base-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("base-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: BNB
    {
      from: DEPLOYER,
      name: "bnb-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("bnb-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Fantom
    {
      from: DEPLOYER,
      name: "fantom-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("fantom-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
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
      name: "gnosis-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("gnosis-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: Optimism
    {
      from: DEPLOYER,
      name: "optimism-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("optimism-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
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
      name: "polygon-depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("polygon-depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Depositor: for manual transfers and testing purposes
    {
      from: DEPLOYER,
      name: "depositor",
      version: dependency("core/tasks/primitives/depositor/v2.0.0"),
      config: {
        tokensSource: counterfactualDependency("depositor"),
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId("swapper-connection"),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
        },
      },
    },
    //Wrapper: wraps native tokens
    {
      from: DEPLOYER,
      name: "wrapper",
      version: dependency("core/tasks/primitives/wrapper/v2.0.0"),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId:
              balanceConnectorId("swapper-connection"),
            nextBalanceConnectorId: balanceConnectorId(
              "wrapper-handle-over-connection"
            ),
          },
          gasLimitConfig: {
            txCostLimitPct: TX_COST_LIMIT_PCT,
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [NATIVE_TOKEN_ADDRESS],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: USDC_CONVERT_THRESHOLD,
              max: 0,
            },
          },
        },
      },
    },
    //Handle over: moves exited bpt to be swapped
    {
      from: DEPLOYER,
      name: "wrapper-handle-over",
      version: dependency("core/tasks/primitives/handle-over/v2.0.0"),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId: balanceConnectorId(
              "wrapper-handle-over-connection"
            ),
            nextBalanceConnectorId: balanceConnectorId("swapper-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    //1inch Swapper: swap assets using 1inch dex aggregator
    {
      from: DEPLOYER,
      name: "1inch-swapper",
      version: dependency("core/tasks/swap/1inch-v5/v2.0.0"),
      config: {
        baseSwapConfig: {
          connector: dependency("core/connectors/1inch-v5/v1.0.0"),
          tokenOut: USDC,
          maxSlippage: fp(0.02), //2%
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency("smart-vault"),
              previousBalanceConnectorId:
                balanceConnectorId("swapper-connection"),
              nextBalanceConnectorId: balanceConnectorId(
                "withdrawer-connection"
              ),
            },
            gasLimitConfig: {
              txCostLimitPct: TX_COST_LIMIT_PCT,
            },
            tokenIndexConfig: {
              acceptanceType: 0,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: USDC_CONVERT_THRESHOLD,
                max: 0,
              },
            },
          },
        },
      },
    },
    //Handle over: moves USDC to be bridged
    {
      from: DEPLOYER,
      name: "usdc-handle-over",
      version: dependency("core/tasks/primitives/handle-over/v2.0.0"),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId:
              balanceConnectorId("swapper-connection"),
            nextBalanceConnectorId: balanceConnectorId("withdrawer-connection"),
          },
          tokenIndexConfig: {
            acceptanceType: 1, //Allow list
            tokens: [USDC],
          },
        },
      },
    },
    //Withdrawer USDC
    {
      from: DEPLOYER,
      name: "withdrawer",
      version: dependency("core/tasks/primitives/withdrawer/v2.0.0"),
      config: {
        recipient: WITHDRAWER_RECIPIENT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId: balanceConnectorId(
              "withdrawer-connection"
            ),
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [USDC],
          },
          timeLockConfig: {
            mode: WITHDRAWER_TIMELOCK_MODE,
            frequency: WITHDRAWER_TIMELOCK_FREQUENCY,
            allowedAt: WITHDRAWER_TIMELOCK_ALLOWED_AT,
            window: WITHDRAWER_TIMELOCK_WINDOW,
          },
        },
      },
    },
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: "relayer-funder-swapper",
      version: dependency("core/tasks/swap/1inch-v5/v2.0.0"),
      config: {
        baseSwapConfig: {
          connector: dependency("core/connectors/1inch-v5/v1.0.0"),
          tokenOut: WRAPPED_NATIVE_TOKEN,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency("smart-vault"),
              previousBalanceConnectorId: balanceConnectorId(
                "withdrawer-connection"
              ),
              nextBalanceConnectorId: balanceConnectorId(
                "relayer-funder-unwrapper"
              ),
            },
            gasLimitConfig: {
              gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: WRAPPED_NATIVE_TOKEN,
                min: MIN_WINDOW_GAS,
                max: MAX_WINDOW_GAS,
              },
            },
          },
        },
      },
    },
    //Relayer Funder Unwrapper: unwraps wrapped native token
    {
      from: DEPLOYER,
      name: "relayer-funder-unwrapper",
      version: dependency("core/tasks/primitives/unwrapper/v2.0.0"),
      config: {
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId: balanceConnectorId(
              "relayer-funder-unwrapper"
            ),
            nextBalanceConnectorId: balanceConnectorId("relayer-depositor"),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 1,
            tokens: [WRAPPED_NATIVE_TOKEN],
          },
        },
      },
    },
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: "relayer-depositor",
      version: dependency("core/tasks/relayer/depositor/v2.0.0"),
      args: [dependency("core/relayer/v1.1.0")],
      config: {
        baseConfig: {
          smartVault: dependency("smart-vault"),
          previousBalanceConnectorId: balanceConnectorId("relayer-depositor"),
        },
        gasLimitConfig: {
          gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
        },
        tokenIndexConfig: {
          acceptanceType: 1,
          tokens: [NATIVE_TOKEN_ADDRESS],
        },
      },
    },
  ],
  permissions: {
    from: USERS_ADMIN,
    authorizer: dependency("authorizer"),
    changes: [
      {
        where: dependency("smart-vault"),
        revokes: [],
        grants: [
          {
            who: dependency("arbitrum-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("arbitrum-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("avalanche-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("avalanche-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("base-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("base-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("bnb-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("bnb-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("fantom-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("fantom-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("gnosis-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("gnosis-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("optimism-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("optimism-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("polygon-depositor"),
            what: "collect",
            params: [],
          },
          {
            who: dependency("polygon-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          { who: dependency("depositor"), what: "collect", params: [] },
          {
            who: dependency("depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("wrapper"),
            what: "wrap",
            params: [],
          },
          {
            who: dependency("wrapper"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("wrapper-handle-over"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("1inch-swapper"),
            what: "execute",
            params: [],
          },
          {
            who: dependency("1inch-swapper"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("usdc-handle-over"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("withdrawer"),
            what: "withdraw",
            params: [],
          },
          {
            who: dependency("withdrawer"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("relayer-funder-swapper"),
            what: "execute",
            params: [
              {
                op: OP.EQ,
                value: dependency("core/connectors/1inch-v5/v1.0.0"),
              },
            ],
          },
          {
            who: dependency("relayer-funder-swapper"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("relayer-funder-unwrapper"),
            what: "unwrap",
            params: [],
          },
          {
            who: dependency("relayer-funder-unwrapper"),
            what: "updateBalanceConnector",
            params: [],
          },
          { who: dependency("relayer-depositor"), what: "call", params: [] },
          {
            who: dependency("relayer-depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
        ],
      },
      {
        where: dependency("arbitrum-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("avalanche-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("base-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("bnb-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("fantom-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("gnosis-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("optimism-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("polygon-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("wrapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("wrapper-handle-over"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("1inch-swapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("usdc-handle-over"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("withdrawer"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-funder-swapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-funder-unwrapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
    ],
  },
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency("smart-vault"),
    feeController: dependency("core/fee-controller/v1.0.0"),
    maxFeePct: fp(0.02), // 2%
    feePct: FEE_PCT,
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency("smart-vault"),
    relayer: dependency("core/relayer/v1.1.0"),
    quota: QUOTA,
  },
};

export default deployment;
