import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { Contract, ContractTransaction, ethers } from 'ethers'

import logger from './logger'
import { Script } from './script'
import { NETWORKS, SafeSigner } from './types'

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
  const txServiceUrl = getTxServiceUrl(script.inputNetwork)
  const safeService = new SafeApiKit({ txServiceUrl, ethAdapter })

  const data = contract.interface.encodeFunctionData(method, args)
  const safeTransactionData = { to: ethers.utils.getAddress(contract.address), value: '0', data }
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

  logger.success(`Safe transaction proposed! Check out ${getSafeQueueUrl(from.safe, script.inputNetwork)}`)
  const { safeTxHash } = await safeService.getTransaction(safeTransactionHash)
  const signature = await safe.signTransactionHash(safeTxHash)
  logger.info(`Confirming safe transaction ${safeTxHash}...`)
  await safeService.confirmTransaction(safeTxHash, signature.data)

  if (from.wait) {
    logger.warn(`Waiting Safe transaction ${safeTxHash} to be executed before proceeding...`)
    const transactionHash = await waitForExecution(safeService, safeTransactionHash)
    logger.success(`Safe transaction executed!`)
    const { ethers: hreEthers } = await import('hardhat')
    const tx = await hreEthers.provider.getTransaction(transactionHash)
    await tx.wait()
    return tx
  } else {
    logger.success(`Safe transaction ${safeTxHash} confirmed!`)
    logger.warn(`Please make sure to execute it before proceeding.`)
  }
}

async function waitForExecution(safeService: SafeApiKit, safeTransactionHash: string): Promise<string> {
  let transaction = await safeService.getTransaction(safeTransactionHash)
  while (!transaction.isExecuted) {
    await sleep(2)
    transaction = await safeService.getTransaction(safeTransactionHash)
  }
  return transaction.transactionHash
}

async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

function getTxServiceUrl(network: (typeof NETWORKS)[number]): string {
  if (network == 'fantom') return 'http://safe-txservice.fantom.network'
  const subdomain = network == 'gnosis' ? 'gnosis-chain' : network
  return `https://safe-transaction-${subdomain}.safe.global`
}

function getSafeQueueUrl(address: string, network: (typeof NETWORKS)[number]): string {
  if (network == 'fantom') return `https://safe.fantom.network/home?safe=ftm:${address}`

  let networkId = network
  if (network === 'mainnet') networkId = 'eth'
  if (network === 'polygon') networkId = 'matic'
  if (network === 'avalanche') networkId = 'avax'
  if (network === 'gnosis') networkId = 'gno'
  if (network === 'arbitrum') networkId = 'arb1'
  if (network === 'optimism') networkId = 'oeth'
  if (network === 'bsc') networkId = 'bnb'
  return `https://app.safe.global/transactions/queue?safe=${networkId}:${address}`
}
