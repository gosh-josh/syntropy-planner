// Loads the right build-time plan for a {zone, goal} pair.
//
// The nine plans are committed as static JSON under ./plans/ by the build
// script. We pull them in with Vite's glob import so each one is a separate
// chunk fetched on demand — the dropdown picks the file, there is no runtime
// API call. `loadPlan` resolves the chunk for the chosen key.

import type { Plan, Zone, GoalTag } from './types'
import { planKey } from './types'

// Lazy glob: each match becomes `() => import('./plans/x.json')`, so only the
// selected plan's JSON is shipped to the browser when it is first requested.
const planLoaders = import.meta.glob<{ default: Plan }>('./plans/*.json')

/** Resolve the cached plan for a {zone, goal} pair, or throw if it's missing. */
export async function loadPlan(zone: Zone, goal: GoalTag): Promise<Plan> {
  const path = `./plans/${planKey(zone, goal)}.json`
  const loader = planLoaders[path]
  if (!loader) {
    throw new Error(`No plan generated for ${planKey(zone, goal)}`)
  }
  const mod = await loader()
  return mod.default
}
