import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from '../dependencies'

export type TaskConfig = {
  baseConfig: {
    smartVault: string | Dependency
    previousBalanceConnectorId: string
    nextBalanceConnectorId: string
  }
  gasLimitConfig: {
    gasPriceLimit: BigNumberish
    priorityFeeLimit: BigNumberish
    txCostLimit: BigNumberish
    txCostLimitPct: BigNumberish
  }
  timeLockConfig: {
    mode: BigNumberish
    frequency: BigNumberish
    allowedAt: BigNumberish
    window: BigNumberish
  }
  tokenIndexConfig: {
    acceptanceType: BigNumberish
    tokens: string[]
  }
  tokenThresholdConfig: {
    defaultThreshold: {
      token: string
      min: BigNumberish
      max: BigNumberish
    }
    customThresholdConfigs: {
      token: string
      min: BigNumberish
      max: BigNumberish
    }[]
  }
  volumeLimitConfig: {
    defaultVolumeLimit: {
      token: string
      amount: BigNumberish
      period: BigNumberish
    }
    customVolumeLimitConfigs: {
      token: string
      volumeLimit: {
        token: string
        amount: BigNumberish
        period: BigNumberish
      }
    }[]
  }
}

export type OptionalTaskConfig = {
  baseConfig: {
    smartVault: string | Dependency
    previousBalanceConnectorId?: string
    nextBalanceConnectorId?: string
  }
  gasLimitConfig?: {
    gasPriceLimit?: BigNumberish
    priorityFeeLimit?: BigNumberish
    txCostLimit?: BigNumberish
    txCostLimitPct?: BigNumberish
  }
  timeLockConfig?: {
    mode: BigNumberish
    frequency: BigNumberish
    allowedAt: BigNumberish
    window: BigNumberish
  }
  tokenIndexConfig?: {
    acceptanceType: BigNumberish
    tokens: string[]
  }
  tokenThresholdConfig?: {
    customThresholdConfigs?: { token: string; min: BigNumberish; max: BigNumberish }[]
    defaultThreshold?: {
      token: string
      min: BigNumberish
      max: BigNumberish
    }
  }
  volumeLimitConfig?: {
    defaultVolumeLimit?: {
      token: string
      amount: BigNumberish
      period: BigNumberish
    }
    customVolumeLimitConfigs?: {
      token: string
      volumeLimit: {
        token: string
        amount: BigNumberish
        period: BigNumberish
      }
    }[]
  }
}
