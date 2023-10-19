import { ZERO_ADDRESS } from '@mimic-fi/v3-helpers'

export const DEFAULT_GAS_LIMIT_CONFIG = {
  gasPriceLimit: 0,
  priorityFeeLimit: 0,
  txCostLimit: 0,
  txCostLimitPct: 0,
}

export const DEFAULT_TIME_LOCK_CONFIG = {
  mode: 0,
  frequency: 0,
  allowedAt: 0,
  window: 0,
}

export const DEFAULT_TOKEN_INDEX_CONFIG = {
  acceptanceType: 0,
  tokens: [],
}

export const DEFAULT_THRESHOLD_CONFIG = {
  customThresholdConfigs: [],
  defaultThreshold: {
    token: ZERO_ADDRESS,
    min: 0,
    max: 0,
  },
}

export const DEFAULT_VOLUME_LIMIT_CONFIG = {
  customVolumeLimitConfigs: [],
  defaultVolumeLimit: {
    token: ZERO_ADDRESS,
    amount: 0,
    period: 0,
  },
}
