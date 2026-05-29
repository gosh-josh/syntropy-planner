# Spec - Syntropy Planner

## What it is

Web app that designs a syntropic agroforestry planting plan. User picks climate zone + primary goal; app returns a 4-layer canopy plan with species and per-layer pruning notes, targeted to them.

Particularly targetted to Bolivia, Guatemala, and/or Peru (since I know these well).

## Inputs

- Climate zone : humid tropical. dry tropical. subtropical highland
- Primary goal : food production. soil regeneration. cash crops

## Output (one page)

- Four canopy cards. Emergent / High / Medium / Low with 3–8 species each
- Per-layer pruning notes
- Mobile: accordion, one layer open at a time. Web: card with pruning panel collapsible on the right

## Stack

Vite + React + TypeScript + Tailwind. Vercel. Anthropic SDK with Haiku 4.5. Static JSON species DB.

- v1.0: Claude called at build time from a local Node script. Output committed as static JSON. No runtime function, no API key in production.
- v1.1: Same prompt + schema wrapped in a Vercel Function (Node runtime, 10s budget) for live generation.

## In scope

- 9 plan variants (3x3).
- Spanish toggle (species + layer labels)
- single page
- mobile-first reactive front end (many farm users are mobile)

## Out of scope

- Maps, GPS, weather
- photos
- accounts
- save/load
- temperate zone
- compatibility checker
- second LLM refinement pass

## Done when

live Vercel Website
repo on github.com/gosh-josh/syntropy-planner
README with screenshot of a real generated plan

## v1.1 (live generation)

- Wrap the v1.0 prompt + schema in a Vercel Function. Same prompt, same schema, same model. Adds: a regenerate button (user can re-roll within the same {zone, goal}), rate limiting (Upstash Redis free tier or per-IP in memory).

## v1.2 (after v1.1 lands)

- Successional timeline. Year 0 / 2 / 5 / 10+ — what gets planted, pruned, harvested. Per-layer (each card carries its own multi-action milestones) vs single global strip TBD once the v1 cards are real and we can see what's missing.

## Extensions

Images of some kind
UI readout displaying the planting in a 2D grid.
Plenty of scope for species refinement, all outside of v1. Species symbiosis. Nitrogen fixation. Speed of ground cover. Timeline transitions through canopy layers. Drought resistance. Flood resistance. Time to produce. Harvest window. Continuous harvests. Pests. Fertilization requirements. Native/non native. Pruning effects on canopy layer. Root radius, shade radius. To name a few. There's so many interconnected fields you almost need a graph db.

---
