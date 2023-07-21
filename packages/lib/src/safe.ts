import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { Contract, ContractTransaction, ethers } from 'ethers'

import logger from './logger'
import { Script } from './script'
import { SafeSigner } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function sendSafeTransaction(
  script: Script,
  contract: Contract,
  method: string,
  args: any[],
  from: SafeSigner
): Promise<ContractTransaction | undefined> {
  const signer = await script.getSigner(from.signer)
  const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
  const safe = await Safe.create({ ethAdapter, safeAddress: from.safe })
  const txServiceUrl = `https://safe-transaction-${script.inputNetwork}.safe.global`
  const safeService = new SafeApiKit({ txServiceUrl, ethAdapter })

  const data = contract.interface.encodeFunctionData(method, args)
  const safeTransactionData = { to: contract.address, value: '0', data }
  const safeTransaction = await safe.createTransaction({ safeTransactionData })
  const safeTransactionHash = await safe.getTransactionHash(safeTransaction)
  const senderSignature = await safe.signTransactionHash(safeTransactionHash)

  logger.info(`Proposing safe transaction ${safeTransactionHash}...`)
  await safeService.proposeTransaction({
    safeAddress: await safe.getAddress(),
    safeTransactionData: safeTransaction.data,
    safeTxHash: safeTransactionHash,
    senderAddress: signer.address,
    senderSignature: senderSignature.data,
  })
  logger.success(`Safe transaction proposed!`)

  const { safeTxHash } = await safeService.getTransaction(safeTransactionHash)
  const signature = await safe.signTransactionHash(safeTxHash)
  logger.info(`Confirming safe transaction ${safeTxHash}...`)
  await safeService.confirmTransaction(safeTxHash, signature.data)
  logger.success(`Safe transaction confirmed!`)

  if (!from.execute) {
    logger.warn(`Skipping safe transaction execution...`)
    return
  }

  logger.info(`Executing safe transaction...`)
  const executeTxResponse = await safe.executeTransaction(safeTransaction)
  if (!executeTxResponse.transactionResponse) throw Error('Could not fetch safe transaction response')
  await executeTxResponse.transactionResponse.wait()
  logger.success(`Safe transaction executed!`)
  return executeTxResponse.transactionResponse
}
