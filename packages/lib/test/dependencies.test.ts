import { ZERO_ADDRESS } from '@mimic-fi/v3-helpers'
import { expect } from 'chai'
import fs from 'fs'
import path from 'path'

import { dependency, solveDependency } from '../src/dependencies'
import { Script } from '../src/script'

describe('dependencies', () => {
  const DIRECTORY = path.join(process.cwd(), 'deploys')
  const DEPLOY_A = 'deploy-a'
  const DEPLOY_B = 'deploy-b'

  beforeEach('create tmp deploys', async () => {
    fs.mkdirSync(DIRECTORY)
    fs.mkdirSync(path.join(DIRECTORY, DEPLOY_A))
    fs.mkdirSync(path.join(DIRECTORY, DEPLOY_B))
  })

  afterEach('remove tmp deploys', async () => {
    fs.rmSync(DIRECTORY, { recursive: true })
  })

  describe('solveDependency', () => {
    const scriptA = new Script(DEPLOY_A, DIRECTORY, 'hardhat')

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
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_A)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_A)
            })
          })
        })
      })

      context('when a key is given', () => {
        const dependencyB = dependency(DEPLOY_B, 'foo')
        const scriptB = new Script(DEPLOY_B, DIRECTORY, 'hardhat')

        context('when the dependency does not exist', () => {
          beforeEach('save output', async () => {
            scriptB.save({ key: 'valueKey' })
          })

          it('fails', async () => {
            expect(() => solveDependency(scriptA, dependencyB)).to.throw(
              'Could not find key "foo" in dependency "deploy-b"'
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
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_B)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_B)
            })
          })
        })
      })
    })

    context('when a path is given', () => {
      context('when no key is given', () => {
        const dependencyA = dependency('packages/lib/deploy-a')

        context('when there is only one output key', () => {
          context('when the output is a key-value pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ key: 'valueKey' })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('key')
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_A)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptA.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyA)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_A)
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
              'Please specify dependency key for "packages/lib/deploy-a"'
            )
          })
        })
      })

      context('when a key is given', () => {
        const dependencyB = dependency('packages/lib/deploy-b', 'foo')
        const scriptB = new Script(DEPLOY_B, DIRECTORY, 'hardhat')

        context('when the dependency does not exist', () => {
          beforeEach('save output', async () => {
            scriptB.save({ key: 'valueKey' })
          })

          it('fails', async () => {
            expect(() => solveDependency(scriptA, dependencyB)).to.throw(
              'Could not find key "foo" in dependency "deploy-b"'
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
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_B)
            })
          })

          context('when the output is a key-version pair', () => {
            beforeEach('save output', async () => {
              scriptB.save({ foo: { version: 'foo', address: ZERO_ADDRESS } })
            })

            it('returns the only existing key', async () => {
              const solvedDependency = solveDependency(scriptA, dependencyB)

              expect(solvedDependency.key).to.be.equal('foo')
              expect(solvedDependency.script.id).to.be.equal(DEPLOY_B)
            })
          })
        })
      })
    })
  })
})
