// Validates one generated plan against the species DB + controlled vocab in
// src/data/types.ts. Used two ways:
//   1. by build-plans.ts after each Claude call, to gate (and retry) output;
//   2. importable as a pure function so chunk 5 / v1.1 can reuse the exact rules.
//
// Dependency-free on purpose (matches validate-species.ts): Node's built-in
// TypeScript type-stripping lets us import the vocab/types directly.
//
// The tool-use input_schema in build-plans.ts already guarantees the *shape*
// (four layers, string arrays, en/es notes). This layer enforces the *meaning*
// the schema can't: ids must be real, sit in the right layer, suit the zone, be
// distinct, and respect a per-layer count that adapts to what the DB can supply.

import { LAYERS, ZONES, GOAL_TAGS } from '../src/data/types.ts'
import type { Species, Zone, GoalTag, Layer, Plan } from '../src/data/types.ts'

/** Spec target band for species per layer; the floor is clamped to DB supply. */
const TARGET_MIN = 3
const TARGET_MAX = 8

/** Candidate species ids for a given zone+layer, drawn from the live DB. */
const candidatesFor = (db: Species[], zone: Zone, layer: Layer): string[] =>
  db.filter((s) => s.layer === layer && s.zones.includes(zone)).map((s) => s.id)

/**
 * Returns a list of human-readable problems with `plan`. Empty list = valid.
 * `zone`/`goal` are the combo we *asked* for, so we can confirm the plan answers
 * the right question (not just that it's internally consistent).
 */
export function validatePlan(
  plan: unknown,
  db: Species[],
  zone: Zone,
  goal: GoalTag,
): string[] {
  const problems: string[] = []
  const byId = new Map(db.map((s) => [s.id, s]))

  if (typeof plan !== 'object' || plan === null) {
    return ['plan is not an object']
  }
  const p = plan as Record<string, unknown>

  if (!ZONES.includes(p.zone as never)) {
    problems.push(`zone "${String(p.zone)}" is not a known zone`)
  } else if (p.zone !== zone) {
    problems.push(`zone is "${String(p.zone)}", expected "${zone}"`)
  }

  if (!GOAL_TAGS.includes(p.goal as never)) {
    problems.push(`goal "${String(p.goal)}" is not a known goal`)
  } else if (p.goal !== goal) {
    problems.push(`goal is "${String(p.goal)}", expected "${goal}"`)
  }

  const layers = p.layers as Record<string, unknown> | undefined
  if (typeof layers !== 'object' || layers === null) {
    problems.push('layers is missing or not an object')
    return problems
  }

  for (const layer of LAYERS) {
    const entry = layers[layer] as Record<string, unknown> | undefined
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`layer "${layer}" is missing`)
      continue
    }

    const avail = candidatesFor(db, zone, layer)
    const floor = Math.min(TARGET_MIN, avail.length)
    const ceil = Math.min(TARGET_MAX, avail.length)

    const ids = entry.species_ids
    if (!Array.isArray(ids)) {
      problems.push(`layer "${layer}": species_ids must be an array`)
    } else {
      if (ids.length < floor || ids.length > ceil) {
        problems.push(
          `layer "${layer}": has ${ids.length} species, expected ${floor}–${ceil} ` +
            `(${avail.length} available for ${zone})`,
        )
      }
      const seen = new Set<string>()
      for (const raw of ids) {
        const id = String(raw)
        if (seen.has(id)) {
          problems.push(`layer "${layer}": duplicate species "${id}"`)
          continue
        }
        seen.add(id)

        const sp = byId.get(id)
        if (!sp) {
          problems.push(`layer "${layer}": unknown species id "${id}"`)
          continue
        }
        if (sp.layer !== layer) {
          problems.push(
            `layer "${layer}": species "${id}" belongs to layer "${sp.layer}"`,
          )
        }
        if (!sp.zones.includes(zone)) {
          problems.push(`layer "${layer}": species "${id}" is not valid for zone "${zone}"`)
        }
      }
    }

    const notes = entry.pruning_notes as Record<string, unknown> | undefined
    if (typeof notes !== 'object' || notes === null) {
      problems.push(`layer "${layer}": pruning_notes missing`)
    } else {
      for (const lang of ['en', 'es'] as const) {
        if (typeof notes[lang] !== 'string' || (notes[lang] as string).trim() === '') {
          problems.push(`layer "${layer}": pruning_notes.${lang} empty`)
        }
      }
    }
  }

  return problems
}

/** Narrowing helper for callers that just want a typed plan or an error. */
export function assertValidPlan(
  plan: unknown,
  db: Species[],
  zone: Zone,
  goal: GoalTag,
): Plan {
  const problems = validatePlan(plan, db, zone, goal)
  if (problems.length) {
    throw new Error(`invalid plan for ${zone}/${goal}:\n  ${problems.join('\n  ')}`)
  }
  return plan as Plan
}
