import { OP } from "@mimic-fi/v3-authorizer";
import {
  balanceConnectorId,
  dependency,
  DEPLOYER,
  EnvironmentDeployment,
  MIMIC_V2_BOT,
  PROTOCOL_ADMIN,
  USERS_ADMIN,
} from "@mimic-fi/v3-deployments-lib";
import {
  chainlink,
  fp,
  NATIVE_TOKEN_ADDRESS,
  tokens,
} from "@mimic-fi/v3-helpers";

/* eslint-disable no-secrets/no-secrets */
const USDC = tokens.avalanche.USDC;
const WETH = tokens.avalanche.WETH;
const OWNER = "0x326A7778DB9B741Cb2acA0DE07b9402C7685dAc6";
const PROTOCOL_FEE_WITHDRAWER = "0x8F42aDBbA1B16EaAE3BB5754915E0D06059aDd75";
const BALANCER_VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const MAINNET_DEPOSITOR_TASK = "";
const STANDARD_GAS_PRICE_LIMIT = 50e9;

const deployment: EnvironmentDeployment = {
  deployer: dependency("core/deployer/v1.0.0"),
  namespace: "balancer-fee-collector",
  authorizer: {
    from: DEPLOYER,
    name: "authorizer",
    version: dependency("core/authorizer/v1.0.0"),
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
            nextBalanceConnectorId: balanceConnectorId(
              "swapper-connection"
            ),
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
    //Asset Collector: collect assets from external source
    {
      from: DEPLOYER,
      name: "asset-collector",
      version: "BalancerClaimer",
      initialize: "initializeProtocolFeeWithdrawer",
      args: [PROTOCOL_FEE_WITHDRAWER],
      config: {
        tokensSource: PROTOCOL_FEE_WITHDRAWER,
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            nextBalanceConnectorId: balanceConnectorId(
              "swapper-connection"
            ),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: fp(10),
              max: 0,
            },
          },
        },
      },
    },
    //Bpt Exiter: unwrap bpt into underlying assets
    {
      from: DEPLOYER,
      name: "bpt-exiter",
      version: dependency(
        "core/tasks/liquidity/balancer/bpt-exiter/v2.0.0"
      ),
      config: {
        balancerVault: BALANCER_VAULT,
        taskConfig: {
          baseConfig: {
            smartVault: dependency("smart-vault"),
            previousBalanceConnectorId: balanceConnectorId(
              "swapper-connection"
            ),
            nextBalanceConnectorId: balanceConnectorId(
              "bpt-handle-over-connection"
            ),
          },
          gasLimitConfig: {
            gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
          },
          tokenIndexConfig: {
            acceptanceType: 0, //Deny list
            tokens: [USDC],
          },
          tokenThresholdConfig: {
            defaultThreshold: {
              token: USDC,
              min: fp(10),
              max: 0,
            },
          },
        },
      },
    },
    //Handle over: moves exited bpt to be swapped
    {
      from: DEPLOYER,
      name: "bpt-handle-over",
      version: dependency("core/tasks/primitives/handle-over/v2.0.0"),
      config: {
        baseConfig: {
          smartVault: dependency("smart-vault"),
          previousBalanceConnectorId: balanceConnectorId(
            "bpt-handle-over-connection"
          ),
          nextBalanceConnectorId: balanceConnectorId(
            "swapper-connection"
          ),
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
              previousBalanceConnectorId: balanceConnectorId(
                "swapper-connection"
              ),
              nextBalanceConnectorId: balanceConnectorId("bridger-connection"),
            },
            gasLimitConfig: {
              gasPriceLimit: STANDARD_GAS_PRICE_LIMIT,
            },
            tokenIndexConfig: {
              acceptanceType: 0,
              tokens: [USDC],
            },
            tokenThresholdConfig: {
              defaultThreshold: {
                token: USDC,
                min: fp(10),
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
        baseConfig: {
          smartVault: dependency("smart-vault"),
          previousBalanceConnectorId: balanceConnectorId(
            "swapper-connection"
          ),
          nextBalanceConnectorId: balanceConnectorId(
            "bridger-connection"
          ),
        },
        tokenIndexConfig: {
          acceptanceType: 1, //Allow list
          tokens: [USDC],
        },
      },
    },
    //Bridger by time: makes sure that by the end of the period, it bridges everything
    {
      from: DEPLOYER,
      name: "cctp-bridger",
      version: dependency("core/tasks/bridge/wormhole/v2.0.0"),
      config: {
        baseBridgeConfig: {
          connector: dependency("core/connectors/wormhole/v1.0.0"),
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
              smartVault: dependency("smart-vault"),
              previousBalanceConnectorId:
                balanceConnectorId("bridger-connection"),
            },
            tokenIndexConfig: {
              acceptanceType: 1,
              tokens: [USDC],
            },
            timeLockConfig: {
              mode: 1, //SECONDS
              frequency: 14 * 60 * 60 * 24, //14 days
              allowedAt: 1699524000, //9 Nov
              window: 2 * 60 * 60 * 24, //2 days
            },
          },
        },
      },
    },
    //Relayer Funder Swapper: swaps assets into native wrapped token to fund the relayer
    {
      from: DEPLOYER,
      name: "relayer-funder-swapper",
      version: dependency("core/tasks/swap/1inch-v5-swapper/v2.0.0"),
      config: {
        baseSwapConfig: {
          connector: dependency("core/connectors/1inch-v5/v1.0.0"),
          tokenOut: WETH,
          maxSlippage: fp(0.02),
          customTokensOut: [],
          customMaxSlippages: [],
          taskConfig: {
            baseConfig: {
              smartVault: dependency("smart-vault"),
              previousBalanceConnectorId:
                balanceConnectorId("bridger-connection"),
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
                token: WETH,
                min: fp(0.005),
                max: fp(0.01),
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
            tokens: [WETH],
          },
        },
      },
    },
    //Relayer Depositor: transfer and funds the relayer
    {
      from: DEPLOYER,
      name: "relayer-depositor",
      version: dependency("core/tasks/relayer/depositor/v2.0.0"),
      args: [dependency("core/relayer/v1.0.0")],
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
          { who: dependency("depositor"), what: "collect", params: [] },
          {
            who: dependency("depositor"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("asset-collector"),
            what: "call",
            params: [],
          },
          {
            who: dependency("asset-collector"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("bpt-exiter"),
            what: "call",
            params: [],
          },
          {
            who: dependency("bpt-exiter"),
            what: "updateBalanceConnector",
            params: [],
          },
          {
            who: dependency("bpt-handle-over"),
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
            who: dependency("cctp-bridger"),
            what: "execute",
            params: [],
          },
          {
            who: dependency("cctp-bridger"),
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
        where: dependency("depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("asset-collector"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("bpt-exiter"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("bpt-handle-over"),
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
        where: dependency("cctp-bridger"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.1.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-funder-swapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.0.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-funder-unwrapper"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.0.0"), what: "call", params: [] },
        ],
      },
      {
        where: dependency("relayer-depositor"),
        revokes: [],
        grants: [
          { who: dependency("core/relayer/v1.0.0"), what: "call", params: [] },
        ],
      },
    ],
  },
  feeSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency("smart-vault"),
    feeController: dependency("core/fee-controller/v1.0.0"),
    maxFeePct: fp(0.02), // 2%
    feePct: fp(0.009), // 0.9%
  },
  relayerSettings: {
    from: PROTOCOL_ADMIN,
    smartVault: dependency("smart-vault"),
    relayer: dependency("core/relayer/v1.1.0"),
    quota: fp(0.01),
  },
};

export default deployment;
