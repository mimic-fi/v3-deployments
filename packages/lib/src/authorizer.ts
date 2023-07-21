import { Contract } from 'ethers'

import logger from './logger'
import { Script } from './script'
import { Account, GrantPermission, isDependency, PermissionChange, RevokePermission, TxParams } from './types'

export async function executePermissionChanges(
  script: Script,
  authorizer: Contract,
  changes: PermissionChange[],
  from: Account
): Promise<void> {
  logger.info(`Executing ${changes.length} permission changes requests on authorizer ${authorizer.address}...`)
  const parsedChanges = await Promise.all(
    changes.map(async (change: PermissionChange) => {
      const where = await script.dependencyInstance(change.where)

      const grants = change.grants.map((grant: GrantPermission) => {
        const who = typeof grant.who === 'string' ? grant.who : script.dependencyAddress(grant.who)
        const what = where.interface.getSighash(grant.what)
        const how = (grant.how || []).map(({ op, value }) => {
          return { op, value: isDependency(value) ? script.dependencyAddress(value) : value }
        })

        return { who, what, params: how }
      })

      const revokes = change.revokes.map((revoke: RevokePermission) => {
        const who = typeof revoke.who === 'string' ? revoke.who : script.dependencyAddress(revoke.who)
        const what = where.interface.getSighash(revoke.what)
        return { who, what }
      })

      return { where: where.address, grants, revokes }
    })
  )

  await script.callContract(authorizer, 'changePermissions', [parsedChanges], from)
  logger.success(`Executed permission changes requests on manager ${authorizer.address} successfully`)
}
