import { useState } from 'react'
import { speciesById } from '../data/species'
import {
  LAYERS,
  LAYER_LABELS,
  ZONE_LABELS,
  GOAL_LABELS,
  type Layer,
  type Species,
  type Plan,
  type PlanLayer,
} from '../data/types'

interface PlanViewProps {
  plan: Plan
}

// Per-layer accent, from the tallest/darkest canopy down to the ground layer.
// Used on the card header strip and the accordion chevrons so the four layers
// stay visually distinct at a glance.
const LAYER_ACCENT: Record<Layer, { bar: string; text: string; dot: string }> = {
  emergent: { bar: 'bg-emerald-700', text: 'text-emerald-800', dot: 'bg-emerald-700' },
  high: { bar: 'bg-emerald-600', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  medium: { bar: 'bg-lime-600', text: 'text-lime-700', dot: 'bg-lime-600' },
  low: { bar: 'bg-amber-600', text: 'text-amber-700', dot: 'bg-amber-600' },
}

/** Resolve a layer's `species_ids` to full Species, dropping any unknown ids. */
function resolveSpecies(ids: string[]): Species[] {
  return ids
    .map((id) => speciesById.get(id))
    .filter((s): s is Species => s !== undefined)
}

/** The species list for one layer — the core content of every card. */
function SpeciesList({ ids }: { ids: string[] }) {
  const species = resolveSpecies(ids)
  if (species.length === 0) {
    return (
      <p className="text-sm italic text-stone-400">
        No species selected for this layer.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {species.map((s) => (
        <li key={s.id} className="flex flex-col">
          <span className="font-medium text-stone-800">{s.name_en}</span>
          <span className="text-sm text-stone-500">
            <span className="italic">{s.scientific}</span>
            {s.name_es && <span className="text-stone-400"> · {s.name_es}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Pruning guidance for one layer. */
function PruningNotes({ data }: { data: PlanLayer }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Pruning
      </h4>
      <p className="text-sm leading-relaxed text-stone-600">{data.pruning_notes.en}</p>
    </div>
  )
}

// --- Mobile: accordion, one layer open at a time -------------------------

function MobileAccordion({ plan }: { plan: Plan }) {
  // Start with the emergent (top) layer open; null = all collapsed.
  const [open, setOpen] = useState<Layer | null>('emergent')

  return (
    <div className="flex flex-col gap-2 md:hidden">
      {LAYERS.map((layer) => {
        const isOpen = open === layer
        const data = plan.layers[layer]
        const accent = LAYER_ACCENT[layer]
        const count = resolveSpecies(data.species_ids).length
        return (
          <div
            key={layer}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : layer)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accent.dot}`} />
              <span className="flex-1">
                <span className={`font-semibold ${accent.text}`}>
                  {LAYER_LABELS[layer].en}
                </span>
                <span className="ml-2 text-sm text-stone-400">{count} species</span>
              </span>
              <svg
                className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-4 border-t border-stone-100 px-4 py-4">
                <SpeciesList ids={data.species_ids} />
                <PruningNotes data={data} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Web: card with collapsible pruning panel to the right ---------------

function DesktopLayerCard({ layer, data }: { layer: Layer; data: PlanLayer }) {
  const [showPruning, setShowPruning] = useState(true)
  const accent = LAYER_ACCENT[layer]
  const count = resolveSpecies(data.species_ids).length

  return (
    <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <span className={`w-1.5 shrink-0 ${accent.bar}`} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
          <h3 className={`text-lg font-semibold ${accent.text}`}>
            {LAYER_LABELS[layer].en}
          </h3>
          <span className="text-sm text-stone-400">{count} species</span>
        </div>
        <div className="flex">
          <div className="min-w-0 flex-1 px-5 py-4">
            <SpeciesList ids={data.species_ids} />
          </div>
          {showPruning ? (
            <aside className="w-72 shrink-0 border-l border-stone-100 bg-stone-50/60 px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Pruning
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPruning(false)}
                  className="text-xs font-medium text-stone-400 hover:text-stone-600"
                >
                  Hide
                </button>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                {data.pruning_notes.en}
              </p>
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setShowPruning(true)}
              className="shrink-0 border-l border-stone-100 px-3 text-xs font-medium text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            >
              Pruning
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DesktopCards({ plan }: { plan: Plan }) {
  return (
    <div className="hidden flex-col gap-4 md:flex">
      {LAYERS.map((layer) => (
        <DesktopLayerCard key={layer} layer={layer} data={plan.layers[layer]} />
      ))}
    </div>
  )
}

// --- Top-level view ------------------------------------------------------

function PlanView({ plan }: PlanViewProps) {
  const generated = new Date(plan.meta.generated_at)
  // Guard against an unparseable timestamp so the footer never renders "Invalid Date".
  const generatedLabel = Number.isNaN(generated.getTime())
    ? null
    : generated.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

  return (
    <section className="flex w-full max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1 text-center">
        <h2 className="text-xl font-semibold text-stone-800">
          {ZONE_LABELS[plan.zone].en} · {GOAL_LABELS[plan.goal].en}
        </h2>
        <p className="text-sm text-stone-500">
          A four-layer syntropic planting plan, canopy to ground.
        </p>
      </header>

      <MobileAccordion plan={plan} />
      <DesktopCards plan={plan} />

      <footer className="text-center text-xs text-stone-400">
        Generated by {plan.meta.model}
        {generatedLabel && ` · ${generatedLabel}`}
      </footer>
    </section>
  )
}

export default PlanView
