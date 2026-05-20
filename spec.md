# Spec - Syntropy Planner

## What it is

Web app that designs a syntropic agroforestry planting plan. User picks climate zone + primary goal; app returns a 4-layer canopy plan with species and a 10-year successional timeline, targeted to them.

Particularly targetted to Bolivia, Guatemala, and/or Peru (since I know these well).

## Inputs

- Climate zone : humid tropical. dry tropical. subtropical highland
- Primary goal : food production. soil regeneration. cash crops

## Output (one page)

- Four canopy cards. Emergent / High / Medium / Low with 5–8 species each
- Successional timeline strip. Year 0 / 2 / 5 / 10+ what gets planted, pruned, harvested
- Per-layer pruning notes

## Stack

Vite + React + TypeScript + Tailwind. Vercel. Vercel Function goes to Anthropic SDK (Which Claude model?). static JSON species DB

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

## Extensions

Images of some kind
UI readout displaying the planting in a 2D grid.

---
