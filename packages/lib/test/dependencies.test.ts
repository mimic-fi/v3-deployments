import { ZERO_ADDRESS } from '@mimic-fi/v3-helpers'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { dependency, solveDependency } from '../src/dependencies'
import { DEFAULT_SCRIPTS_DIRECTORY_NAME, Script } from '../src/script'

describe('dependencies', () => {
  const DIRECTORY = path.join(process.cwd(), DEFAULT_SCRIPTS_DIRECTORY_NAME)
  const SCRIPT_A = 'script-a'
  const SCRIPT_B = 'script-b'

  beforeEach('create tmp scripts dir', async () => {
    fs.mkdirSync(DIRECTORY)
    fs.mkdirSync(path.join(DIRECTORY, SCRIPT_A))
    fs.mkdirSync(path.join(DIRECTORY, SCRIPT_B))
  })

  afterEach('remove tmp scripts dir', async () => {
    fs.rmSync(DIRECTORY, { recursive: true })
  })

  describe('solveDependency', () => {
    const scriptA = new Script(SCRIPT_A, DIRECTORY, 'hardhat', 'hardhat')

    context('when no path is given', () => {
      context('when no key is given', () => {
        const dependencyA = dependency('foo')

        context('when the dependency does not exist', () => {
          beforeEach('save output', async () => {
            scriptA.save({ key: 'valueKey' })
          })

          it('fails', async () => {
            expect(() => solveDependency(scriptA, dependencyA)).to.throw('Please specify dependency key for "foo"')
          })
        })

        context('when the dependency exists', () => {
          context('when the output is a key-value pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ key: 'valueKey' })
              scriptA.save({ foo: 'valueFoo' })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_A)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_A)
            })
          })
        })
      })

      context('when a key is given', () => {
        const dependencyB = dependency(SCRIPT_B, 'foo')
        const scriptB = new Script(SCRIPT_B, DIRECTORY, 'hardhat', 'hardhat')

        context('when the dependency does not exist', () => {
          beforeEach('save output', async () => {
            scriptB.save({ key: 'valueKey' })
          })

          it('fails', async () => {
            expect(() => solveDependency(scriptA, dependencyB)).to.throw(
              'Could not find key "foo" in dependency "script-b"'
            )
          })
        })

        context('when the dependency exists', () => {
          context('when the output is a key-value pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ key: 'valueKey' })
              scriptB.save({ foo: 'valueFoo' })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_B)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_B)
            })
          })
        })
      })
    })

    context('when a path is given', () => {
      context('when no key is given', () => {
        const dependencyA = dependency('lib/script-a')

        context('when there is only one output key', () => {
          context('when the output is a key-value pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ key: 'valueKey' })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('key')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_A)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_A)
            })
          })
        })

        context('when there are multiple output keys', () => {
          beforeEach('save output', async () => {
            scriptA.save({ key: 'valueKey' })
            scriptA.save({ foo: 'valueFoo' })
          })

          it('returns the existing key', async () => {
            expect(() => solveDependency(scriptA, dependencyA)).to.throw(
              'Please specify dependency key for "lib/script-a"'
            )
          })
        })
      })

      context('when a key is given', () => {
        const dependencyB = dependency('lib/script-b', 'foo')
        const scriptB = new Script(SCRIPT_B, DIRECTORY, 'hardhat', 'hardhat')

        context('when the dependency does not exist', () => {
          beforeEach('save output', async () => {
            scriptB.save({ key: 'valueKey' })
          })

          it('fails', async () => {
            expect(() => solveDependency(scriptA, dependencyB)).to.throw(
              'Could not find key "foo" in dependency "script-b"'
            )
          })
        })

        context('when the dependency exists', () => {
          context('when the output is a key-value pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ key: 'valueKey' })
              scriptB.save({ foo: 'valueFoo' })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_B)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(SCRIPT_B)
            })
          })
        })
      })
    })
  })
})
