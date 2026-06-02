import { useState } from 'react'
import PlannerForm, { type PlannerSelection } from './components/PlannerForm'

function App() {
  const [loading, setLoading] = useState(false)

  function handleSubmit(selection: PlannerSelection) {
    // Chunk 5 replaces this with loading the cached plan JSON for the
    // {zone, goal} pair and rendering the layer cards. For now we just
    // exercise the form's loading state.
    setLoading(true)
    console.log('Selected', selection)
    setTimeout(() => setLoading(false), 1200)
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
    </main>
  )
}

export default App
