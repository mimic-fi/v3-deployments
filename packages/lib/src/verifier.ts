import { Etherscan } from '@nomicfoundation/hardhat-verify/internal/etherscan'
import {
  ExtendedContractInformation,
  extractMatchingContractInformation,
  getLibraryInformation,
  LibraryToAddress,
} from '@nomicfoundation/hardhat-verify/internal/solc/artifacts'
import { Bytecode } from '@nomicfoundation/hardhat-verify/internal/solc/bytecode'
import { encodeArguments, sleep } from '@nomicfoundation/hardhat-verify/internal/utilities'
import { BuildInfo, HardhatRuntimeEnvironment } from 'hardhat/types'

import logger from './logger'
import { Script } from './script'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default class Verifier {
  hre: HardhatRuntimeEnvironment
  apiKey: string

  constructor(hre: HardhatRuntimeEnvironment, apiKey: string) {
    this.hre = hre
    this.apiKey = apiKey
  }

  async call(
    script: Script,
    name: string,
    address: string,
    constructorArguments: unknown,
    libraries: LibraryToAddress = {}
  ): Promise<string> {
    const chainConfig = await Etherscan.getCurrentChainConfig(this.hre.network.name, this.hre.network.provider, [])
    const etherscan = Etherscan.fromChainConfig(this.apiKey, chainConfig)

    const isVerified = await etherscan.isVerified(address)
    if (!isVerified) return this.verify(etherscan, script, name, address, constructorArguments, libraries)

    const contractURL = etherscan.getContractUrl(address)
    logger.info(`The contract ${address} has already been verified on ${contractURL}`)
    return contractURL
  }

  private async verify(
    etherscan: Etherscan,
    script: Script,
    name: string,
    address: string,
    args: unknown,
    libraries: LibraryToAddress
  ): Promise<string> {
    const deployedBytecode = await this.getDeployedContractBytecode(address)
    const buildInfo = script.buildInfos().find((buildInfo) => !!this.findContractSourceName(buildInfo, name))
    if (!buildInfo) throw Error('Could not find a bytecode matching the requested contract')

    const sourceName = this.findContractSourceName(buildInfo, name)
    if (!sourceName) throw Error('Could not find a source name for the requested contract')

    const contractFQN = `${sourceName}:${name}`
    const contractInformation = await extractMatchingContractInformation(contractFQN, buildInfo, deployedBytecode)
    if (!contractInformation) throw Error('Could not find a bytecode matching the requested contract')

    const libraryInformation = await getLibraryInformation(contractInformation, libraries)
    const extendedContractInformation: ExtendedContractInformation = { ...contractInformation, ...libraryInformation }

    const encodedConstructorArguments = await encodeArguments(
      extendedContractInformation.contractOutput.abi,
      extendedContractInformation.sourceName,
      extendedContractInformation.contractName,
      args as any[]
    )

    // Ensure the linking information is present in the compiler input;
    const compilerInput = extendedContractInformation.compilerInput
    compilerInput.settings.libraries = extendedContractInformation.libraries

    const { message: guid } = await etherscan.verify(
      address,
      JSON.stringify(compilerInput),
      `${contractInformation.sourceName}:${contractInformation.contractName}`,
      `v${contractInformation.solcLongVersion}`,
      encodedConstructorArguments
    )

    logger.info(
      `Successfully submitted source code for contract ${contractInformation.sourceName}:${contractInformation.contractName} at ${address} for verification on the block explorer. Waiting for verification result...`
    )
    await sleep(700)
    const verificationStatus = await etherscan.getVerificationStatus(guid)

    if (!(verificationStatus.isFailure() || verificationStatus.isSuccess())) {
      throw Error(verificationStatus.message)
    }

    if (verificationStatus.isSuccess()) {
      const contractURL = etherscan.getContractUrl(address)
      logger.info(`Successfully verified contract ${contractInformation.contractName} on ${contractURL}\n`)
      return contractURL
    }

    throw Error(`Unknown verification status ${verificationStatus}`)
  }

  private async getDeployedContractBytecode(address: string): Promise<Bytecode> {
    const response: string = await this.hre.network.provider.send('eth_getCode', [address, 'latest'])
    const deployedBytecode = response.replace(/^0x/, '')
    if (deployedBytecode === '') throw Error('Could not find a bytecode matching the requested contract')
    return new Bytecode(deployedBytecode)
  }

  private findContractSourceName(buildInfo: BuildInfo, contractName: string): string | undefined {
    const names = this.getAllFullyQualifiedNames(buildInfo)
    const contractMatches = names.filter((name) => name.contractName === contractName)
    if (contractMatches.length === 0) return
    if (contractMatches.length > 1) throw Error('More than one contract was found to match the deployed bytecode')
    return contractMatches[0].sourceName
  }

  private getAllFullyQualifiedNames(buildInfo: BuildInfo): Array<{ sourceName: string; contractName: string }> {
    const contracts = buildInfo.output.contracts
    return Object.keys(contracts).reduce((names: { sourceName: string; contractName: string }[], sourceName) => {
      const contractsNames = Object.keys(contracts[sourceName])
      const qualifiedNames = contractsNames.map((contractName) => ({ sourceName, contractName }))
      return names.concat(qualifiedNames)
    }, [])
  }
}
