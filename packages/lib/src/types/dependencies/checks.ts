import { CounterFactualDependency, Dependency } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export function isDependency(object: any): object is Dependency {
  return !!(object as Dependency).id
}

export function isCounterFactualDependency(object: any): object is CounterFactualDependency {
  return isDependency(object) && (object as CounterFactualDependency).counterfactual
}
