// Validates src/data/species.json against the schema + controlled vocab in
// src/data/types.ts. Run with: npm run validate:species
//
// Dependency-free: relies on Node's built-in TypeScript type-stripping (Node 22.6+)
// so it can import the vocab constants directly from types.ts.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ZONES, LAYERS, GOAL_TAGS } from '../src/data/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const speciesPath = join(here, '..', 'src', 'data', 'species.json')

const REQUIRED_STRING_FIELDS = [
  'id',
  'name_en',
  'name_es',
  'scientific',
  'pruning_window',
  'notes',
] as const

const errors: string[] = []
const err = (i: number, id: string, msg: string) =>
  errors.push(`  [${i}] ${id || '<no id>'}: ${msg}`)

let data: unknown
try {
  data = JSON.parse(readFileSync(speciesPath, 'utf8'))
} catch (e) {
  console.error(`Could not parse species.json: ${(e as Error).message}`)
  process.exit(1)
}

if (!Array.isArray(data)) {
  console.error('species.json must be a JSON array.')
  process.exit(1)
}

const seenIds = new Set<string>()

data.forEach((entry, i) => {
  const e = entry as Record<string, unknown>
  const id = typeof e.id === 'string' ? e.id : ''

  for (const f of REQUIRED_STRING_FIELDS) {
    if (typeof e[f] !== 'string' || (e[f] as string).trim() === '') {
      err(i, id, `missing or empty string field "${f}"`)
    }
  }

  if (id) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) err(i, id, 'id is not kebab-case')
    if (seenIds.has(id)) err(i, id, 'duplicate id')
    seenIds.add(id)
  }

  if (!LAYERS.includes(e.layer as never)) {
    err(i, id, `layer "${String(e.layer)}" not one of ${LAYERS.join(', ')}`)
  }

  if (!Array.isArray(e.zones) || e.zones.length === 0) {
    err(i, id, 'zones must be a non-empty array')
  } else {
    for (const z of e.zones) {
      if (!ZONES.includes(z as never)) err(i, id, `unknown zone "${String(z)}"`)
    }
  }

  if (!Array.isArray(e.goal_tags) || e.goal_tags.length === 0) {
    err(i, id, 'goal_tags must be a non-empty array')
  } else {
    for (const g of e.goal_tags) {
      if (!GOAL_TAGS.includes(g as never)) err(i, id, `unknown goal_tag "${String(g)}"`)
    }
  }

  const p = e.prune_start_years
  if (p !== null && (typeof p !== 'number' || !Number.isInteger(p) || p < 0)) {
    err(i, id, 'prune_start_years must be a non-negative integer or null')
  }
})

if (errors.length) {
  console.error(`\n✗ species.json invalid (${errors.length} problem(s)):\n`)
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`✓ species.json valid — ${data.length} species, all ids unique.`)
