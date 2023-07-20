import {
  ArtifactLike,
  deploy,
  fp,
  getCreationCode,
  getSigner,
  getSigners,
  impersonate,
  instanceAt,
  Libraries,
} from '@mimic-fi/v3-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import SafeApiKit from '@safe-global/api-kit'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { BigNumber, Contract, ContractTransaction, ethers } from 'ethers'
import fs from 'fs'
import { BuildInfo, HardhatRuntimeEnvironment } from 'hardhat/types'
import path, { extname } from 'path'

import { solveDependency } from './dependencies'
import { deployEnvironment, updateEnvironment } from './deployer'
import logger from './logger'
import { createRegistryImplementation } from './registry'
import {
  Account,
  Artifact,
  BuildInfoContract,
  Dependency,
  EnvironmentDeployment,
  EnvironmentUpdate,
  Input,
  isContractDeployment,
  isDependency,
  isEnvironmentDeployment,
  isEnvironmentUpdate,
  isEOA,
  isRegistryImplementationDeployment,
  isSafeSigner,
  Network,
  NETWORKS,
  Output,
  ReadOutputParams,
  RegistryImplementationDeployment,
  SafeSigner,
  ScriptInput,
  TxParams,
} from './types'
import Verifier from './verifier'

const SCRIPTS_DIRECTORY = path.resolve(process.cwd(), 'deploys')

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

export class Script {
  id: string
  directory: string
  _network?: Network
  _verifier?: Verifier
  _outputFile?: string

  static fromHRE(id: string, hre: HardhatRuntimeEnvironment, verifier?: Verifier): Script {
    return new this(id, SCRIPTS_DIRECTORY, hre.network.name, verifier)
  }

  static forTest(id: string, network: Network, outputTestFile = 'test'): Script {
    const script = new this(id, SCRIPTS_DIRECTORY, network)
    script.outputFile = outputTestFile
    return script
  }

  constructor(id: string, directory: string, network?: Network, verifier?: Verifier) {
    if (network && !NETWORKS.includes(network)) throw Error(`Unknown network ${network}`)
    this.id = id
    this.directory = directory
    this._network = network
    this._verifier = verifier
  }

  get isTest(): boolean {
    return this._outputFile === 'test'
  }

  get isDevelopment(): boolean {
    return this.network === 'hardhat' || this.network === 'localhost'
  }

  get outputFile(): string {
    return `${this._outputFile || this.network}.json`
  }

  set outputFile(file: string) {
    this._outputFile = file
  }

  get network(): Network {
    if (!this._network) throw Error('A network must be specified to define a deployment script')
    return this._network
  }

  set network(name: Network) {
    this._network = name
  }

  async getCreationCode(contractName: string, args: Array<any> = [], libs?: Libraries): Promise<string> {
    const artifactLike = this.artifactLike(contractName)
    return getCreationCode(artifactLike, args, libs)
  }

  async instanceAt(contractName: string, address: string): Promise<Contract> {
    const artifactLike = this.artifactLike(contractName)
    return instanceAt(artifactLike, address)
  }

  async deployedInstance(contractName: string, instanceName = contractName): Promise<Contract> {
    const output = this.output()[instanceName]
    if (!output) throw Error(`Could not find deployed address for ${instanceName}`)
    const address = typeof output === 'string' ? output : output.address
    return this.instanceAt(contractName, address)
  }

  async dependencyInstance(dependency: Dependency): Promise<Contract> {
    const { script, key } = solveDependency(this, dependency)
    return script.deployedInstance(key)
  }

  async dependencyInstanceAt(dependency: Dependency, address: string): Promise<Contract> {
    const { script, key } = solveDependency(this, dependency)
    return script.instanceAt(key, address)
  }

  dependencyAddress(dependency: Dependency): string {
    const { script, key } = solveDependency(this, dependency)
    const output = script.output()[key]
    return typeof output === 'string' ? output : output.address
  }

  async run(from?: string, force?: boolean): Promise<void> {
    const input = this.input() as ScriptInput
    const account = from ? { address: from } : input.from
    const txParams = { from: account, force: !!force }

    if (isEnvironmentDeployment(input)) {
      logger.info('Deploying environment...')
      await deployEnvironment(this, input as EnvironmentDeployment, txParams)
    } else if (isEnvironmentUpdate(input)) {
      logger.info('Updating environment...')
      await updateEnvironment(this, input as EnvironmentUpdate, txParams)
    } else if (isRegistryImplementationDeployment(input)) {
      logger.info('Registering new implementation...')
      await createRegistryImplementation(this, input as RegistryImplementationDeployment, txParams)
    } else if (isContractDeployment(input)) {
      logger.info('Deploying stand alone contract...')
      await this.deployAndVerify(input.contract, input.args, txParams, input.name)
    } else {
      logger.info('Running custom script...')
      const scriptPath = this._fileAt(this.dir(), 'index.ts')
      const script = require(scriptPath).default
      await script(this, txParams)
    }
  }

  async callContract(
    contract: Contract,
    method: string,
    args: any[],
    from: Account
  ): Promise<ContractTransaction | undefined> {
    if (isEOA(from)) {
      const signer = await this.getSigner(from.address)
      const tx = await contract.connect(signer)[method](...args)
      await tx.wait()
      return tx
    } else if (isSafeSigner(from)) {
      const { safe, safeTransaction } = await this._proposeSafeTransaction(contract, method, args, from)
      if (!from.execute) return
      const executeTxResponse = await safe.executeTransaction(safeTransaction)
      if (!executeTxResponse.transactionResponse) throw Error('Could not fetch safe transaction response')
      await executeTxResponse.transactionResponse.wait()
      return executeTxResponse.transactionResponse
    } else {
      throw Error('Cannot call contract from other account type than EOA or safe')
    }
  }

  async deploy(contractName: string, args: Array<any>, txParams: TxParams): Promise<Contract> {
    const artifactLike = this.artifactLike(contractName)
    if (!isEOA(txParams.from)) throw Error('Cannot deploy contract from other account type than EOA')
    const signer = await this.getSigner(txParams.from.address)
    const instance = await deploy(artifactLike, args, signer, txParams.libs)
    logger.success(`Deployed ${contractName} at ${instance.address}`)
    return instance
  }

  async verify(contractName: string, address: string, args: unknown, libs?: Libraries): Promise<void> {
    try {
      if (!this._verifier) return logger.warn('Skipping contract verification, no verifier defined')
      const url = await this._verifier.call(this, contractName, address, args, libs)
      logger.success(`Verified contract ${contractName} at ${url}`)
    } catch (error) {
      logger.error(`Failed trying to verify ${contractName} at ${address}: ${error}`)
    }
  }

  async deployAndVerify(
    contractName: string,
    args: Array<any>,
    txParams: TxParams,
    instanceName = contractName
  ): Promise<Contract> {
    const output = this.output({ ensure: false })[instanceName]

    if (txParams.force || !output) {
      const instance = await this.deploy(contractName, args, txParams)
      this.save({ [instanceName]: instance.address })
      await this.verify(contractName, instance.address, args, txParams.libs)
      return instance
    } else {
      const address = typeof output === 'string' ? output : output.address
      logger.info(`${contractName} already deployed at ${address}`)
      await this.verify(contractName, address, args, txParams.libs)
      return this.instanceAt(contractName, address)
    }
  }

  async getSigner(address: string): Promise<SignerWithAddress> {
    const signers = await getSigners()
    const signer = signers.find((signer) => signer.address == address)
    if (signer) return getSigner(address)

    if (!this.isTest && !this.isDevelopment) throw Error(`Please add the PK for signer ${address}`)
    logger.warn(`Impersonating ${address} due to dev/test env detected`)
    return impersonate(address, fp(10))
  }

  dir(): string {
    if (!this.id) throw Error('Provide a script deployment ID')
    if (!this.directory) throw Error('Provide a script deployment directory')
    return this._dirAt(this.directory, this.id)
  }

  buildInfoDir(): string {
    return this._dirAt(this.dir(), 'build-info')
  }

  buildInfos(): Array<BuildInfo> {
    return fs.readdirSync(this.buildInfoDir()).map((fileName) => this.buildInfo(fileName))
  }

  buildInfo(fileName: string): BuildInfo {
    const artifactFile = this._fileAt(this.buildInfoDir(), `${extname(fileName) ? fileName : `${fileName}.json`}`)
    return JSON.parse(fs.readFileSync(artifactFile).toString())
  }

  artifactLike(name: string): ArtifactLike {
    const artifact = this.artifact(name)
    const { object, linkReferences } = artifact.evm.bytecode
    return { abi: artifact.abi, bytecode: object, linkReferences }
  }

  artifact(contractName: string): Artifact {
    const existsBuildInfo = this._existsFile(path.join(this.buildInfoDir(), `${contractName}.json`))
    const builds: BuildInfoContract = existsBuildInfo
      ? this.buildInfo(contractName).output.contracts
      : this.buildInfos().reduce((result, info: BuildInfo) => ({ ...result, ...info.output.contracts }), {})

    const source = Object.keys(builds).find((source) => Object.keys(builds[source]).find((key) => key === contractName))
    if (!source) throw Error(`Could not find artifact for ${contractName}`)
    return builds[source][contractName]
  }

  input(): Input {
    return this._parseRawInput(this.networkRawInput())
  }

  networkRawInput(): Input {
    const rawInput = this.rawInput()
    const globalInput = { ...rawInput }
    NETWORKS.forEach((network) => delete globalInput[network])
    const networkInput = rawInput[this.network] || {}
    return { ...globalInput, ...networkInput }
  }

  rawInput(): Input {
    const networkInputPath = path.join(this.dir(), `input.${this.network}.ts`)
    if (this._existsFile(networkInputPath)) return require(networkInputPath).default
    const globalInputPath = this._fileAt(this.dir(), 'input.ts')
    return require(globalInputPath).default
  }

  output({ ensure = true, network, outputFile }: ReadOutputParams = {}): Output {
    if (network) this.network = network
    const scriptOutputDir = this._dirAt(this.dir(), 'output', ensure)
    const scriptOutputFile = this._fileAt(scriptOutputDir, outputFile || this.outputFile, ensure)
    return this._read(scriptOutputFile)
  }

  save(output: Output): void {
    const scriptOutputDir = this._dirAt(this.dir(), 'output', false)
    if (!fs.existsSync(scriptOutputDir)) fs.mkdirSync(scriptOutputDir)

    const scriptOutputFile = this._fileAt(scriptOutputDir, this.outputFile, false)
    const previousOutput = this._read(scriptOutputFile)
    const finalOutput = { ...previousOutput, ...output }
    this._write(scriptOutputFile, finalOutput)
  }

  delete(): void {
    const scriptOutputDir = this._dirAt(this.dir(), 'output')
    const scriptOutputFile = this._fileAt(scriptOutputDir, this.outputFile)
    fs.unlinkSync(scriptOutputFile)
  }

  private async _proposeSafeTransaction(contract: Contract, method: string, args: any[], from: SafeSigner) {
    const data = contract.interface.encodeFunctionData(method, args)
    const safeTransactionData = { to: contract.address, value: '0', data }

    const signer = await this.getSigner(from.signer)
    const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })

    const safe = await Safe.create({ ethAdapter, safeAddress: from.safe })
    const safeTransaction = await safe.createTransaction({ safeTransactionData })
    const safeTransactionHash = await safe.getTransactionHash(safeTransaction)
    const senderSignature = await safe.signTransactionHash(safeTransactionHash)
    const txServiceUrl = `https://safe-transaction.${this.network}.gnosis.io/`
    const safeService = new SafeApiKit({ txServiceUrl, ethAdapter })
    await safeService.proposeTransaction({
      safeAddress: await safe.getAddress(),
      safeTransactionData: safeTransaction.data,
      safeTxHash: safeTransactionHash,
      senderAddress: signer.address,
      senderSignature: senderSignature.data,
    })

    const { safeTxHash } = await safeService.getTransaction(safeTransactionHash)
    const signature = await safe.signTransactionHash(safeTxHash)
    await safeService.confirmTransaction(safeTxHash, signature.data)
    return { safe, safeTransaction }
  }

  private _parseRawInput(rawNetworkInput: Input): Input {
    return Object.keys(rawNetworkInput).reduce((input: Input, key: string) => {
      const item = rawNetworkInput[key]
      if (Array.isArray(item)) input[key] = item.map((i: any) => (isDependency(i) ? this.dependencyAddress(i) : i))
      else if (BigNumber.isBigNumber(item)) input[key] = item
      else if (typeof item !== 'object') input[key] = item
      else input[key] = this._parseRawInput(item)
      return input
    }, {})
  }

  private _read(path: string): Output {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path).toString()) : {}
  }

  private _write(path: string, output: Output): void {
    const finalOutputJSON = JSON.stringify(output, null, 2)
    fs.writeFileSync(path, finalOutputJSON)
  }

  private _fileAt(base: string, name: string, ensure = true): string {
    const filePath = path.join(base, name)
    if (ensure && !this._existsFile(filePath)) throw Error(`Could not find a file at ${filePath}`)
    return filePath
  }

  private _dirAt(base: string, name: string, ensure = true): string {
    const dirPath = path.join(base, name)
    if (ensure && !this._existsDir(dirPath)) throw Error(`Could not find a directory at ${dirPath}`)
    return dirPath
  }

  private _existsFile(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  }

  private _existsDir(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  }
}
