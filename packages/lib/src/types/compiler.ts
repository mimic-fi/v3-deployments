import { CompilerOutputBytecode, CompilerOutputContract } from 'hardhat/types'

export type Artifact = {
  abi: unknown[]
  evm: {
    bytecode: CompilerOutputBytecode
    deployedBytecode: CompilerOutputBytecode
    methodIdentifiers: {
      [methodSignature: string]: string
    }
  }
}

export type BuildInfoContract = {
  [sourceName: string]: {
    [contractName: string]: CompilerOutputContract
  }
}
