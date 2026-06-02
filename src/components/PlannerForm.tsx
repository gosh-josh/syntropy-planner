import { useState } from 'react'
import {
  ZONES,
  ZONE_LABELS,
  GOAL_TAGS,
  GOAL_LABELS,
  type Zone,
  type GoalTag,
} from '../data/types'

export interface PlannerSelection {
  zone: Zone
  goal: GoalTag
}

interface PlannerFormProps {
  /** Called with the chosen {zone, goal} when the form is submitted. */
  onSubmit: (selection: PlannerSelection) => void
  /** True while a plan is being produced — disables inputs and shows progress. */
  loading?: boolean
}

// Shared classes for the two <select>s, kept here so they stay identical.
const selectClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-800 ' +
  'shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

function PlannerForm({ onSubmit, loading = false }: PlannerFormProps) {
  // Empty string = "not yet chosen"; submit stays disabled until both are set.
  const [zone, setZone] = useState<Zone | ''>('')
  const [goal, setGoal] = useState<GoalTag | ''>('')

  const ready = zone !== '' && goal !== ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready || loading) return
    onSubmit({ zone, goal })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-5 text-left">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="zone" className="text-sm font-medium text-stone-700">
          Climate zone
        </label>
        <select
          id="zone"
          value={zone}
          onChange={(e) => setZone(e.target.value as Zone)}
          disabled={loading}
          className={selectClass}
        >
          <option value="" disabled>
            Select a climate zone…
          </option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {ZONE_LABELS[z].en}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="goal" className="text-sm font-medium text-stone-700">
          Primary goal
        </label>
        <select
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as GoalTag)}
          disabled={loading}
          className={selectClass}
        >
          <option value="" disabled>
            Select a primary goal…
          </option>
          {GOAL_TAGS.map((g) => (
            <option key={g} value={g}>
              {GOAL_LABELS[g].en}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!ready || loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
        )}
        {loading ? 'Designing plan…' : 'Design plan'}
      </button>
    </form>
  )
}

export default PlannerForm
