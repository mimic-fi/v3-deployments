import { BigNumberish } from '@mimic-fi/v3-helpers'

import { Dependency } from './dependencies'

export type RevokePermission = {
  who: string | Dependency
  what: string
}

export type GrantPermission = {
  who: string | Dependency
  what: string
  params: { op: number; value: string | BigNumberish | Dependency }[]
}

export type PermissionChange = {
  where: Dependency
  grants: GrantPermission[]
  revokes: RevokePermission[]
}

export type ParsedRevokePermission = {
  who: string
  what: string
}

export type ParsedGrantPermission = {
  who: string
  what: string
  params: { op: number; value: string | BigNumberish | Dependency }[]
}

export type ParsedPermissionChange = {
  where: string
  grants: ParsedGrantPermission[]
  revokes: ParsedRevokePermission[]
}
