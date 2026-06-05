// Build-time plan generator (plan.md / spec.md chunk 4).
//
// Loops the 9 {zone, goal} combinations, asks Claude Haiku 4.5 to assemble a
// four-layer syntropic plan *by picking species ids out of species.json*, runs
// the result through validate-plan.ts, retries on failure, and writes each plan
// to src/data/plans/{zone}_{goal}.json.
//
//   ANTHROPIC_API_KEY=... npm run build:plans        # all 9
//   ANTHROPIC_API_KEY=... npm run build:plans -- humid_tropical food   # one combo
//
// The key is read from the environment and never written anywhere — these JSON
// files are the only artifact that ships. No runtime API call in v1.0.
//
// Dependency-free: Node's global fetch talks to the Anthropic Messages API
// directly, and type-stripping lets us import the vocab + validator. The big
// species block is sent with cache_control so calls 2–9 reuse the cached prefix.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { ZONES, GOAL_TAGS, LAYERS, ZONE_LABELS, GOAL_LABELS, planKey } from '../src/data/types.ts'
import type { Species, Zone, GoalTag, Plan } from '../src/data/types.ts'
import { validatePlan } from './validate-plan.ts'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_ATTEMPTS = 3
const MAX_TOKENS = 2048

const here = dirname(fileURLToPath(import.meta.url))
const speciesPath = join(here, '..', 'src', 'data', 'species.json')
const outDir = join(here, '..', 'src', 'data', 'plans')

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error(
    'ANTHROPIC_API_KEY is not set.\n' +
      'Run with: ANTHROPIC_API_KEY=sk-ant-... npm run build:plans\n' +
      '(or put it in a local .env file — it is git-ignored and never deployed).',
  )
  process.exit(1)
}

const db: Species[] = JSON.parse(readFileSync(speciesPath, 'utf8'))

// --- The species menu Claude is allowed to pick from, as compact JSON. -------
// Sent once in the cached system block. We hand over only the fields that inform
// selection + pruning prose; ids are the contract the plan must reference.
const speciesMenu = db.map((s) => ({
  id: s.id,
  name_en: s.name_en,
  name_es: s.name_es,
  scientific: s.scientific,
  layer: s.layer,
  zones: s.zones,
  goal_tags: s.goal_tags,
  prune_start_years: s.prune_start_years,
  pruning_window: s.pruning_window,
  notes: s.notes,
}))

const SYSTEM = [
  {
    type: 'text',
    text:
      'You are a syntropic-agroforestry designer working in the tropics of ' +
      'Bolivia, Guatemala and Peru, in the lineage of Ernst Götsch. You design ' +
      'four-strata plantings (emergent / high / medium / low canopy) tuned to a ' +
      'climate zone and a primary goal.\n\n' +
      'HARD RULES:\n' +
      '- Choose species ONLY by the `id` field from the SPECIES DB below. Never ' +
      'invent a species and never use a name that is not in the DB.\n' +
      '- A species may appear in a plan only if its `layer` matches the card you ' +
      'place it in AND its `zones` includes the requested zone.\n' +
      '- Aim for 3–8 species per layer, but a layer offers only as many as the ' +
      'DB has for that zone — use them all rather than padding or repeating.\n' +
      '- Lead each layer with species whose `goal_tags` include the requested ' +
      'goal, then add the structural / service species (e.g. nitrogen-fixers, ' +
      'shade trees) that make the system work even if they are not goal-tagged.\n' +
      '- pruning_notes: practical, specific to the species you picked and to the ' +
      "zone's wet/dry rhythm; give English (en) and Spanish (es). 1–3 sentences.\n" +
      '- Return your answer ONLY through the `emit_plan` tool.',
  },
  {
    type: 'text',
    text: 'SPECIES DB (the only selectable species):\n' + JSON.stringify(speciesMenu),
    cache_control: { type: 'ephemeral' },
  },
]

const layerSchema = {
  type: 'object',
  properties: {
    species_ids: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 8,
      description: 'Species `id`s from the DB for this layer; no duplicates.',
    },
    pruning_notes: {
      type: 'object',
      properties: {
        en: { type: 'string', description: 'Pruning guidance for this layer, English.' },
        es: { type: 'string', description: 'Same guidance, Spanish.' },
      },
      required: ['en', 'es'],
      additionalProperties: false,
    },
  },
  required: ['species_ids', 'pruning_notes'],
  additionalProperties: false,
}

const TOOL = {
  name: 'emit_plan',
  description: 'Emit the four-layer planting plan.',
  input_schema: {
    type: 'object',
    properties: {
      layers: {
        type: 'object',
        properties: Object.fromEntries(LAYERS.map((l) => [l, layerSchema])),
        required: [...LAYERS],
        additionalProperties: false,
      },
    },
    required: ['layers'],
    additionalProperties: false,
  },
}

/** Per-zone menu, grouped by layer, so the model sees exactly its options. */
function menuForZone(zone: Zone): string {
  const lines: string[] = []
  for (const layer of LAYERS) {
    const inLayer = db.filter((s) => s.layer === layer && s.zones.includes(zone))
    lines.push(
      `${layer.toUpperCase()} (${inLayer.length}): ` +
        (inLayer.map((s) => `${s.id} [${s.goal_tags.join('/')}]`).join(', ') || 'none'),
    )
  }
  return lines.join('\n')
}

interface ToolUse {
  type: string
  name?: string
  input?: unknown
}

async function callClaude(messages: unknown[]): Promise<Record<string, unknown>> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'emit_plan' },
      messages,
    }),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }
  const body = (await res.json()) as { content?: ToolUse[] }
  const toolUse = body.content?.find((c) => c.type === 'tool_use' && c.name === 'emit_plan')
  if (!toolUse?.input) {
    throw new Error(`no emit_plan tool_use in response: ${JSON.stringify(body)}`)
  }
  return toolUse.input as Record<string, unknown>
}

/** Generate + validate one combo, retrying with feedback on schema failure. */
async function generatePlan(zone: Zone, goal: GoalTag): Promise<Plan> {
  const basePrompt =
    `Design the plan for:\n` +
    `- zone: ${zone} (${ZONE_LABELS[zone].en})\n` +
    `- goal: ${goal} (${GOAL_LABELS[goal].en})\n\n` +
    `Selectable species for THIS zone, by layer (with their goal_tags):\n` +
    menuForZone(zone)

  const messages: unknown[] = [{ role: 'user', content: basePrompt }]

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const input = await callClaude(messages)
    const candidate = {
      zone,
      goal,
      layers: input.layers,
    }
    const problems = validatePlan(candidate, db, zone, goal)
    if (problems.length === 0) {
      return {
        zone,
        goal,
        layers: candidate.layers as Plan['layers'],
        meta: { model: MODEL, generated_at: new Date().toISOString() },
      }
    }

    console.warn(`  attempt ${attempt} failed validation:\n    ${problems.join('\n    ')}`)
    if (attempt < MAX_ATTEMPTS) {
      // Feed the failed output + errors back so the model corrects course.
      messages.push({
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'retry', name: 'emit_plan', input }],
      })
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'retry',
            content:
              'That plan is invalid. Fix every problem and re-emit via emit_plan:\n- ' +
              problems.join('\n- '),
          },
        ],
      })
    }
  }
  throw new Error(`gave up on ${zone}/${goal} after ${MAX_ATTEMPTS} attempts`)
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const combos: Array<{ zone: Zone; goal: GoalTag }> = []
  if (argv.length === 2) {
    const [zone, goal] = argv as [Zone, GoalTag]
    if (!ZONES.includes(zone) || !GOAL_TAGS.includes(goal)) {
      console.error(`Usage: build:plans [<zone> <goal>]\n  zones: ${ZONES.join(', ')}\n  goals: ${GOAL_TAGS.join(', ')}`)
      process.exit(1)
    }
    combos.push({ zone, goal })
  } else {
    for (const zone of ZONES) for (const goal of GOAL_TAGS) combos.push({ zone, goal })
  }

  mkdirSync(outDir, { recursive: true })

  let ok = 0
  const failures: string[] = []
  for (const { zone, goal } of combos) {
    const key = planKey(zone, goal)
    process.stdout.write(`→ ${key} ... `)
    try {
      const plan = await generatePlan(zone, goal)
      writeFileSync(join(outDir, `${key}.json`), JSON.stringify(plan, null, 2) + '\n')
      const counts = LAYERS.map((l) => plan.layers[l].species_ids.length).join('/')
      console.log(`ok (${counts} species per layer)`)
      ok++
    } catch (e) {
      console.log('FAILED')
      console.error(`  ${(e as Error).message}`)
      failures.push(key)
    }
  }

  console.log(`\nDone: ${ok}/${combos.length} plans written to src/data/plans/`)
  if (failures.length) {
    console.error(`Failed: ${failures.join(', ')}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
