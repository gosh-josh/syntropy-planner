import { useState } from 'react'
import PlannerForm, { type PlannerSelection } from './components/PlannerForm'
import PlanView from './components/PlanView'
import { loadPlan } from './data/plans'
import type { Plan } from './data/types'

function App() {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(selection: PlannerSelection) {
    setLoading(true)
    setError(null)
    try {
      // Imports the cached JSON chunk for the chosen {zone, goal} — no API call.
      const next = await loadPlan(selection.zone, selection.goal)
      setPlan(next)
    } catch (err) {
      console.error(err)
      setPlan(null)
      setError('Sorry — no plan is available for that combination yet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center gap-8 bg-stone-50 px-6 py-12">
      <header className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
          Syntropy Planner
        </h1>
        <p className="text-stone-500">
          Syntropic agroforestry planting plans for the humid tropics, dry
          tropics, and subtropical highlands.
        </p>
      </header>

      <PlannerForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <p className="max-w-md text-center text-sm text-red-600">{error}</p>
      )}

      {plan && <PlanView plan={plan} />}
    </main>
  )
}

export default App
