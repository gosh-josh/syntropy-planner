## Plan

1. Scaffold + deploy. Vite, Tailwind, Vercel project. blank page live on a URL
2. Species JSON. 30–50 species across the three zones with structured fields (name_en, name_es, layer, zones[], goal_tags[], pruning_window, notes). Götsch material. The data quality is the project. Use species I know
3. Form UI. Couple dropdowns, submit, loading state. Tailwind.
4. Serverless function + Claude prompt. Not done this type of live AI API intergration before. Tricky? Function takes {zone, goal} + species JSON. Claude returns a strictly typed plan matching a Zod/Valibot schema. validate, retry on schema fail. No free text fields the LLM can hallucinate species into, picks from JSON.
5. Output rendering. Four layer cards + timeline strip. Refine and Polish this once done
6. Spanish toggle + README + push. en / es toggle, even if minimal. README opens with "I built this after a year volunteering on syntropic projects in Guatemala, Bolivia and Peru", screenshot, "future work" list.

---

## Potential pitfalls:

- Chunk 2 - speciesi must be good. Not LLM gemerated. backbone of the app
- Chunk 4 - claude outputs being sloppy will be problematic. need strict format and species json.
