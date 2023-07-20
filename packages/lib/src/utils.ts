import { utils } from 'ethers'

export function balanceConnectorId(name: string): string {
  return utils.solidityKeccak256(['string'], [name])
}
