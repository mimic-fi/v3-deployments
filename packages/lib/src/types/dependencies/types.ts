import { Script } from '../../script'

export type Dependency = {
  id: string
  key?: string
}

export type SolvedDependency = {
  script: Script
  key: string
}

export type CounterFactualDependency = Dependency & {
  counterfactual: true
}
