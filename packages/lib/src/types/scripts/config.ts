import { Dependency } from '../dependencies'
import { Network } from '../shared'

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Input = {
  [key: string]: any
}

export type Output = {
  [key: string]: string | { version: string | Dependency; address: string }
}

export type ReadOutputParams = {
  ensure?: boolean
  network?: Network
  outputFile?: string
}
