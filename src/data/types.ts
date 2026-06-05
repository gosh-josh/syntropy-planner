// Species database schema + controlled vocabularies for Syntropy Planner.
//
// This file is the single source of truth for the shape of the species DB and
// for the three user-facing dimensions (zone, layer, goal). The build script
// (chunk 4) constrains Claude to pick species *by id* from species.json, so the
// vocab here must stay aligned with the dropdown options in the form (chunk 3).

// --- Climate zones (maps to the spec's "Climate zone" input) ---
export const ZONES = ['humid_tropical', 'dry_tropical', 'subtropical_highland'] as const
export type Zone = (typeof ZONES)[number]

export const ZONE_LABELS: Record<Zone, { en: string; es: string }> = {
  humid_tropical: { en: 'Humid tropical', es: 'Trópico húmedo' },
  dry_tropical: { en: 'Dry tropical', es: 'Trópico seco' },
  subtropical_highland: { en: 'Subtropical highland', es: 'Altiplano subtropical' },
}

// --- Canopy layers (the four output cards: Emergent / High / Medium / Low) ---
export const LAYERS = ['emergent', 'high', 'medium', 'low'] as const
export type Layer = (typeof LAYERS)[number]

export const LAYER_LABELS: Record<Layer, { en: string; es: string }> = {
  emergent: { en: 'Emergent', es: 'Emergente' },
  high: { en: 'High', es: 'Alto' },
  medium: { en: 'Medium', es: 'Medio' },
  low: { en: 'Low', es: 'Bajo' },
}

// --- Primary goals (maps to the spec's "Primary goal" input) ---
export const GOAL_TAGS = ['food', 'soil', 'cash'] as const
export type GoalTag = (typeof GOAL_TAGS)[number]

export const GOAL_LABELS: Record<GoalTag, { en: string; es: string }> = {
  food: { en: 'Food production', es: 'Producción de alimentos' },
  soil: { en: 'Soil regeneration', es: 'Regeneración del suelo' },
  cash: { en: 'Cash crops', es: 'Cultivos comerciales' },
}

/**
 * One curated species entry. The fields beyond the spec's original list are:
 *  - `id`:         stable kebab-case slug, used to reference species without
 *                  relying on free-text names (lets chunk 4 constrain Claude).
 *  - `scientific`: Latin binomial — the strongest disambiguator for data quality.
 */
export interface Species {
  /** Stable kebab-case identifier, unique across the DB. */
  id: string
  /** Common name, English. */
  name_en: string
  /** Common name, Spanish (regional name used in Bolivia/Guatemala/Peru where it differs). */
  name_es: string
  /** Latin binomial, e.g. "Inga edulis". */
  scientific: string
  /** Canopy layer this species occupies in a syntropic system. */
  layer: Layer
  /** Zones where this species is appropriate. */
  zones: Zone[]
  /** Which primary goals this species serves. */
  goal_tags: GoalTag[]
  /**
   * Years into the planting before pruning begins — the plant has to establish
   * first. `0` means within the first year / from establishment. `null` means
   * the species isn't pruned at all (annuals, root crops, replace-don't-prune).
   * The `pruning_window` rhythm only applies once the plant reaches this age.
   */
  prune_start_years: number | null
  /**
   * The seasonal/within-year pruning rhythm *once the plant is mature enough to
   * prune* (see `prune_start_years`). Expressed relative to the tropical wet/dry
   * cycle or harvest, not a temperate calendar. Describes the non-pruning
   * management instead when `prune_start_years` is null.
   */
  pruning_window: string
  /** Short curator note: role in the system, why it's here, how it's managed. */
  notes: string
}

export type SpeciesDB = Species[]

// --- Plans (the build-script output, chunk 4) ---
//
// One plan = one {zone, goal} variant. Nine of them are generated at build time
// by scripts/build-plans.ts and committed as static JSON under src/data/plans/.
// The frontend (chunk 5) imports the right file by `{zone}_{goal}` and never
// calls an API at runtime.
//
// Species are referenced by `id` only — never by free text — so a plan can only
// ever point at curated entries in species.json. That's the guardrail against
// Claude inventing species (see plan.md pitfall on chunk 4).

/** One canopy card's worth of a plan. */
export interface PlanLayer {
  /**
   * Curated species in this layer, by `Species.id`. Each id must exist in
   * species.json, sit in *this* layer, and be valid for the plan's zone.
   * Targets 3–8 per the spec, but a layer is capped by what the DB actually
   * offers for the zone (e.g. emergent species are few), so a thin layer with
   * fewer than 3 is legitimate rather than a generation failure.
   */
  species_ids: string[]
  /**
   * How to manage pruning across this layer for the given zone/goal, bilingual
   * to feed the Spanish toggle. Generated prose, constrained to the species the
   * plan actually picked — not a free-text species channel.
   */
  pruning_notes: { en: string; es: string }
}

/** One generated {zone, goal} plan: the four canopy cards plus provenance. */
export interface Plan {
  zone: Zone
  goal: GoalTag
  /** Every layer is present; order is the canopy order in LAYERS. */
  layers: Record<Layer, PlanLayer>
  /** Build-time provenance — which model produced this and when. */
  meta: {
    model: string
    /** ISO 8601 timestamp of generation. */
    generated_at: string
  }
}

/** Canonical basename (without extension) for a plan file: `{zone}_{goal}`. */
export const planKey = (zone: Zone, goal: GoalTag): string => `${zone}_${goal}`
