# Species DB — curation guide

This directory holds the species database that the whole app is built on. Per the
spec, **the data quality _is_ the project**. These species are hand-curated, not
machine-generated, and Claude (chunk 4) only ever *picks from this list* — it
never invents species.

## ⚠️ Provenance

The current `species.json` is partially human and partially AI-drafted. Needs further review later, but proceeding as-is to get the project going

- **`prune_start_years`** — how many years before pruning begins is a rough draft
  per species; check it against how fast each one establishes in your region.
- **`pruning_window`** — the timing relative to the wet/dry cycle is the field most
  likely to be wrong for a given region.
- **`zones`** — a species may be listed for a zone where it's marginal in practice.
- **`name_es`** — regional names vary across Bolivia / Guatemala / Peru

## Target

30–50 species total, spread so that every `{zone, goal}` pair has a sensible plan
at all four layers. There are 20 so far; expand from species you know first-hand.

## Schema

Each entry conforms to the `Species` interface in `types.ts`. Fields:

| field            | type                  | notes |
|------------------|-----------------------|-------|
| `id`             | kebab-case string     | unique, stable; how species are referenced everywhere else |
| `name_en`        | string                | common English name |
| `name_es`        | string                | regional Spanish name(s) |
| `scientific`     | string                | Latin binomial — the disambiguator |
| `layer`          | enum                  | `emergent` \| `high` \| `medium` \| `low` |
| `zones`          | enum[]                | any of `humid_tropical`, `dry_tropical`, `subtropical_highland` |
| `goal_tags`      | enum[]                | any of `food`, `soil`, `cash` |
| `prune_start_years` | number \| null     | years into growth before pruning begins; `0` = from establishment; `null` = never pruned |
| `pruning_window` | string                | the seasonal/within-year rhythm *once mature enough to prune*; describes non-pruning management when `prune_start_years` is `null` |
| `notes`          | string                | role in the system, why it's here, how it's managed |

The controlled vocabularies (and their English/Spanish display labels) live in
`types.ts` — that's the single source of truth. Don't introduce a zone/layer/goal
value that isn't defined there.

## Entry template

```json
{
  "id": "genus-commonname",
  "name_en": "",
  "name_es": "",
  "scientific": "",
  "layer": "high",
  "zones": ["humid_tropical"],
  "goal_tags": ["food"],
  "prune_start_years": 2,
  "pruning_window": "",
  "notes": ""
}
```

## Validating

After editing `species.json`:

```bash
npm run validate:species
```

This checks every entry against the schema and controlled vocab, and flags
duplicate ids. Keep it green before committing.
