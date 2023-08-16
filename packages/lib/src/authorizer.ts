import { BigNumber, Contract } from 'ethers'

import logger from './logger'
import { Script } from './script'
import {
  GrantPermission,
  isDependency,
  ParsedPermissionChange,
  PermissionChange,
  PermissionsUpdate,
  RevokePermission,
} from './types'

export async function executePermissionChanges(script: Script, permissions: PermissionsUpdate): Promise<void> {
  const authorizer = await script.dependencyInstance(permissions.authorizer)

  logger.info(`Executing ${permissions.changes.length} permission changes on authorizer ${authorizer.address}...`)
  const parsedChanges = await parsePermissionChanges(script, permissions.changes)
  const filteredChanges = await removeDuplicatedPermissions(authorizer, parsedChanges)

  if (filteredChanges.length > 0) {
    await script.callContract(authorizer, 'changePermissions', [filteredChanges], permissions.from)
    logger.success(`Executed permission changes requests on manager ${authorizer.address} successfully`)
  } else {
    logger.warn(`No permission changes requests on manager ${authorizer.address} to execute`)
  }
}

async function parsePermissionChanges(script: Script, changes: PermissionChange[]): Promise<ParsedPermissionChange[]> {
  return Promise.all(
    changes.map(async (change: PermissionChange) => {
      const where = await script.dependencyInstance(change.where)

      const grants = change.grants.map((grant: GrantPermission) => {
        const who = typeof grant.who === 'string' ? grant.who : script.dependencyAddress(grant.who)
        const what = where.interface.getSighash(grant.what)
        const params = (grant.params || []).map(({ op, value }) => {
          return { op, value: isDependency(value) ? script.dependencyAddress(value) : value }
        })

        return { who, what, params }
      })

      const revokes = change.revokes.map((revoke: RevokePermission) => {
        const who = typeof revoke.who === 'string' ? revoke.who : script.dependencyAddress(revoke.who)
        const what = where.interface.getSighash(revoke.what)
        return { who, what }
      })

      return { where: where.address, grants, revokes }
    })
  )
}

async function removeDuplicatedPermissions(
  authorizer: Contract,
  changes: ParsedPermissionChange[]
): Promise<ParsedPermissionChange[]> {
  const result: ParsedPermissionChange[] = []

  for (const change of changes) {
    const filteredChange: ParsedPermissionChange = { where: change.where, grants: [], revokes: [] }

    for (const grant of change.grants) {
      const isAuthorized = await authorizer.isAuthorized(grant.who, change.where, grant.what, [])
      if (!isAuthorized) {
        const grantedParams = await authorizer.getPermissionParams(grant.who, change.where, grant.what)
        const sameParamsLength = grantedParams.length === grant.params.length
        const includesAllParams = grant.params.every((param, i) => {
          const grantedParam = grantedParams[i]
          return grantedParam.op == param.op && grantedParam.value.toString() == BigNumber.from(param.value).toString()
        })
        const sameParams = sameParamsLength && includesAllParams
        if (!sameParams) filteredChange.grants.push(grant)
      }
    }

    for (const revoke of change.revokes) {
      const isAuthorized = await authorizer.isAuthorized(revoke.who, change.where, revoke.what, [])
      if (isAuthorized) filteredChange.revokes.push(revoke)
    }

    if (filteredChange.grants.length > 0 || filteredChange.revokes.length > 0) {
      result.push(filteredChange)
    }
  }

  return result
}
