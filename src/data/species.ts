// Runtime access to the curated species DB.
//
// species.json is the build-time source of truth (see CURATION.md). Plans
// reference species by `id` only, so the renderer needs a fast id → Species
// lookup to turn those ids back into displayable names and notes.

import data from './species.json'
import type { Species, SpeciesDB } from './types'

export const SPECIES: SpeciesDB = data as SpeciesDB

/** id → Species, for resolving the `species_ids` a plan layer references. */
export const speciesById: ReadonlyMap<string, Species> = new Map(
  SPECIES.map((s) => [s.id, s]),
)
