import {
  ArtifactLike,
  deploy,
  fp,
  getCreationCode,
  getForkedNetwork,
  getSigner,
  getSigners,
  impersonate,
  instanceAt,
  Libraries,
} from '@mimic-fi/v3-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber, Contract, ContractTransaction } from 'ethers'
import fs from 'fs'
import { BuildInfo, HardhatRuntimeEnvironment } from 'hardhat/types'
import path, { extname } from 'path'

import { dependency, solveDependency } from './dependencies'
import { deployEnvironment, updateEnvironment } from './deployer'
import logger from './logger'
import { createRegistryImplementation } from './registry'
import { sendSafeTransaction } from './safe'
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
  ScriptInput,
} from './types'
import Verifier from './verifier'

export const DEFAULT_SCRIPTS_DIRECTORY_NAME = 'scripts'
const SCRIPTS_DIRECTORY = path.resolve(process.cwd(), DEFAULT_SCRIPTS_DIRECTORY_NAME)

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

export class Script {
  id: string
  directory: string
  inputNetwork: Network
  outputNetwork: Network
  _verifier?: Verifier

  static forForkedNetwork(id: string, hre: HardhatRuntimeEnvironment, verifier?: Verifier): Script {
    return new this(id, SCRIPTS_DIRECTORY, getForkedNetwork(hre), hre.network.name, verifier)
  }

  static fromHRE(id: string, hre: HardhatRuntimeEnvironment, verifier?: Verifier): Script {
    return new this(id, SCRIPTS_DIRECTORY, hre.network.name, hre.network.name, verifier)
  }

  constructor(id: string, directory: string, inputNetwork: Network, outputNetwork: Network, verifier?: Verifier) {
    if (!NETWORKS.includes(inputNetwork)) throw Error(`Unknown input network ${inputNetwork}`)
    if (!NETWORKS.includes(outputNetwork)) throw Error(`Unknown output network ${outputNetwork}`)

    this.id = id
    this.directory = directory
    this.inputNetwork = inputNetwork
    this.outputNetwork = outputNetwork
    this._verifier = verifier
  }

  get isDevelopment(): boolean {
    return this.outputNetwork === 'hardhat' || this.outputNetwork === 'localhost'
  }

  get outputFile(): string {
    return `${this.outputNetwork}.json`
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
    if (typeof output === 'string') return this.instanceAt(contractName, output)
    const versionDependency = isDependency(output.version) ? output.version : dependency(output.version)
    return this.dependencyInstanceAt(versionDependency, output.address)
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

  async run(): Promise<void> {
    if (this.isDevelopment) this.delete()
    const input = this.input() as ScriptInput

    if (isEnvironmentDeployment(input)) {
      logger.info('Deploying environment...')
      await deployEnvironment(this, input as EnvironmentDeployment)
    } else if (isEnvironmentUpdate(input)) {
      logger.info('Updating environment...')
      await updateEnvironment(this, input as EnvironmentUpdate)
    } else if (isRegistryImplementationDeployment(input)) {
      logger.info('Registering new implementation...')
      await createRegistryImplementation(this, input as RegistryImplementationDeployment)
    } else if (isContractDeployment(input)) {
      logger.info('Deploying stand alone contract...')
      await this.deployAndVerify(input.contract, input.args, input.from, input.instanceName)
    } else {
      logger.info('Running custom script...')
      const scriptPath = this._fileAt(this.dir(), 'index.ts')
      const script = require(scriptPath).default
      await script(this)
    }
  }

  async callContract(
    contract: Contract,
    method: string,
    args: any[],
    from: Account
  ): Promise<ContractTransaction | undefined> {
    if (isEOA(from)) return this._call(contract, method, args, from.address)
    else if (isSafeSigner(from)) {
      if (this.isDevelopment) return this._call(contract, method, args, from.safe)
      else return sendSafeTransaction(this, contract, method, args, from)
    } else throw Error('Cannot call contract from other account type than EOA or safe')
  }

  async deployAndVerify(
    contractName: string,
    args: Array<any>,
    from: Account,
    instanceName = contractName
  ): Promise<Contract> {
    const output = this.output({ ensure: false })[instanceName]

    if (!output) {
      const instance = await this._deploy(contractName, args, from)
      this.save({ [instanceName]: instance.address })
      await this._verify(contractName, instance.address, args)
      return instance
    } else {
      const address = typeof output === 'string' ? output : output.address
      logger.info(`${contractName} already deployed at ${address}`)
      await this._verify(contractName, address, args)
      return this.instanceAt(contractName, address)
    }
  }

  async verify(contract?: string): Promise<void> {
    const input = this.input() as ScriptInput
    if (!isContractDeployment(input)) throw Error('Only contract deployments can be verified')

    const outputs = this.output({ ensure: false })
    const contracts = Object.keys(outputs)
    if (contract && !outputs[contract]) throw Error(`Could not find output for contract "${contract}"`)
    if (contracts.length == 0 && !contract) throw Error('No script output to verify')
    if (contracts.length > 1 && !contract) throw Error('Please specify contract to verify')

    const contractName = contract || contracts[0]
    const output = outputs[contractName]
    const address = typeof output === 'string' ? output : output.address
    await this._verify(contractName, address, input.args)
  }

  async getSigner(address: string): Promise<SignerWithAddress> {
    const signers = await getSigners()
    const signer = signers.find((signer) => signer.address == address)
    if (signer) return getSigner(address)

    if (!this.isDevelopment) throw Error(`Please add the PK for signer ${address}`)
    logger.warn(`Impersonating ${address} due to dev env detected`)
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
    const networkInput = rawInput[this.inputNetwork] || {}
    return { ...globalInput, ...networkInput }
  }

  rawInput(): Input {
    const networkInputPath = path.join(this.dir(), `input.${this.inputNetwork}.ts`)
    if (this._existsFile(networkInputPath)) return require(networkInputPath).default
    const globalInputPath = this._fileAt(this.dir(), 'input.ts')
    return require(globalInputPath).default
  }

  output({ ensure = true }: ReadOutputParams = {}): Output {
    const scriptOutputDir = this._dirAt(this.dir(), 'output', ensure)
    const scriptOutputFile = this._fileAt(scriptOutputDir, this.outputFile, ensure)
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
    const scriptOutputDir = this._dirAt(this.dir(), 'output', false)
    const scriptOutputFile = this._fileAt(scriptOutputDir, this.outputFile, false)
    if (this._existsFile(scriptOutputFile)) fs.unlinkSync(scriptOutputFile)
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

  private async _call(contract: Contract, method: string, args: any[], from: string): Promise<ContractTransaction> {
    const signer = await this.getSigner(from)
    const tx = await contract.connect(signer)[method](...args)
    await tx.wait()
    return tx
  }

  private async _deploy(contractName: string, args: Array<any>, from: Account): Promise<Contract> {
    const artifactLike = this.artifactLike(contractName)
    if (!isEOA(from)) throw Error('Cannot deploy contract from other account type than EOA')
    const signer = await this.getSigner(from.address)
    const instance = await deploy(artifactLike, args, signer)
    logger.success(`Deployed ${contractName} at ${instance.address}`)
    return instance
  }

  private async _verify(contractName: string, address: string, args: unknown): Promise<void> {
    try {
      if (!this._verifier) return logger.warn('Skipping contract verification, no verifier defined')
      const url = await this._verifier.call(this, contractName, address, args)
      logger.success(`Verified contract ${contractName} at ${url}`)
    } catch (error) {
      logger.error(`Failed trying to verify ${contractName} at ${address}: ${error}`)
    }
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
