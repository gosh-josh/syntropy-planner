## Plan

1. Scaffold + deploy. Vite, Tailwind, Vercel project. blank page live on a URL
2. Species JSON. 30–50 species across the three zones with structured fields (name_en, name_es, layer, zones[], goal_tags[], pruning_window, notes). Götsch material. The data quality is the project. Use species I know
3. Form UI. Couple dropdowns, submit, loading state. Tailwind.
4. Build script + Claude prompt. Node script runs locally, loops over the 9 {zone, goal} combinations, calls Claude (Haiku 4.5) for each, validates against Zod/Valibot schema, retries on schema fail. Writes results to src/data/plans/{zone}_{goal}.json. ANTHROPIC_API_KEY stays local — never deployed. No free text fields the LLM can hallucinate species into, picks from JSON.
5. Output rendering. Four layer cards (mobile: accordion. web: pruning panel collapsible right of each card). Frontend imports the right JSON based on dropdown — no runtime API call. Refine and Polish this once done.
6. Spanish toggle + README + push. en / es toggle, even if minimal. README opens with "I built this after a year volunteering on syntropic projects in Guatemala, Bolivia and Peru", screenshot, "future work" list.

---

## v1.1 (live generation)

7. Vercel Function wrapping the v1.0 prompt + schema. Same code path, called at request time instead of build time. Adds: a regenerate button so users can re-roll within the same {zone, goal}, rate limiting via Upstash Redis free tier or per-IP in memory. Haiku 4.5 on Node runtime — see spec.md Stack for rationale.

---

## v1.2 (after v1.1 lands)

8. Successional timeline. Year 0 / 2 / 5 / 10+ with multi-action milestones (each year is a mix of plant/prune/harvest, not a single action). Decide per-layer vs global strip once the v1 cards are live and we can see what's missing. Extends the Claude schema by appending to each layer object — non-breaking.

---

## Potential pitfalls:

- Chunk 2 - speciesi must be good. Not LLM generated. backbone of the app
- Chunk 4 - claude outputs being sloppy will be problematic. need strict format and species json. (bad build-time output = bad cached plan that ships)
- Chunk 7 (v1.1) - need rate limiting to prevent API spend
- Chunk 7 (v1.1) - 10s Vercel hobby-tier timeout. Haiku 4.5 stays under it (~2-4s), but a schema-fail retry doubles worst case.
