import { useMemo, useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import BottomNav from './components/BottomNav'
import StatCard from './components/StatCard'
import WorkoutPlayer from './components/WorkoutPlayer'
import { exercises } from './data/exercises'
import { usePersistentState } from './hooks/usePersistentState'
import './styles/app.css'

const defaults = {
  settings: { rounds: 3, proteinGoal: 180, startWeight: '', goalWeight: '', weeklyGoal: 3 },
  workouts: [],
  health: [],
  session: { round: 1, index: 0, completed: [], startedAt: null }
}

const today = () => new Date().toISOString().slice(0, 10)

function calcStreak(workouts) {
  const days = [...new Set(workouts.map(w => w.date))].sort().reverse()
  if (!days.length) return { current: 0, longest: 0 }
  let longest = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000
    run = diff === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }
  let current = 0
  let cursor = new Date()
  if (!days.includes(today())) cursor.setDate(cursor.getDate() - 1)
  while (days.includes(cursor.toISOString().slice(0, 10))) {
    current++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { current, longest }
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [data, setData] = usePersistentState('gregfit_v4', defaults)
  const streak = useMemo(() => calcStreak(data.workouts), [data.workouts])
  const minutes = data.workouts.reduce((sum, w) => sum + Number(w.minutes || 0), 0)
  const latestHealth = [...data.health].sort((a,b) => b.date.localeCompare(a.date))[0] || {}
  const todayHealth = data.health.find(h => h.date === today()) || {}
  const progressPct = Math.round((data.session.completed.length / (Number(data.settings.rounds) * exercises.length)) * 100) || 0

  const patch = updater => setData(prev => typeof updater === 'function' ? updater(prev) : updater)

  const finishWorkout = (session) => {
    const end = Date.now()
    const note = window.prompt('Workout complete! Add an optional note:') || ''
    const workout = {
      date: today(),
      minutes: Math.max(1, Math.round((end - session.startedAt) / 60000)),
      rounds: Number(data.settings.rounds),
      notes: note,
    }
    patch(prev => ({
      ...prev,
      workouts: [workout, ...prev.workouts],
      session: { round: 1, index: 0, completed: [], startedAt: null }
    }))
    setScreen('home')
  }

  const saveHealth = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const entry = Object.fromEntries(form.entries())
    patch(prev => ({ ...prev, health: [...prev.health.filter(h => h.date !== entry.date), entry] }))
    event.currentTarget.reset()
  }

  const saveSettings = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    patch(prev => ({ ...prev, settings: { ...prev.settings, ...Object.fromEntries(form.entries()) } }))
  }

  const exportCsv = () => {
    const rows = [['Date','Minutes','Rounds','Notes'], ...data.workouts.map(w => [w.date,w.minutes,w.rounds,w.notes || ''])]
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `gregfit-${today()}.csv`
    a.click()
  }

  const HomeScreen = () => (
    <div className="stack">
      <div className="stat-grid">
        <StatCard value={data.workouts.length} label="Total workouts" />
        <StatCard value={minutes} label="Minutes trained" />
        <StatCard value={latestHealth.weight ? `${latestHealth.weight} lb` : '—'} label="Latest weight" />
        <StatCard value={`${todayHealth.protein || 0}g`} label="Protein today" />
      </div>

      <section className="card workout-feature">
        <div className="feature-image">
          <img src={`${import.meta.env.BASE_URL}assets/illustrations/swing.svg`} alt="Kettlebell swing illustration" />
        </div>
        <div className="feature-copy">
          <span className="badge">Today</span>
          <h2>Greg’s Full-Body Circuit</h2>
          <p>9 exercises · about 25–35 minutes</p>
          <div className="progress"><div style={{ width: `${progressPct}%` }} /></div>
          <strong>{progressPct}% complete</strong>
          <button className="btn primary full" onClick={() => setScreen('workout')}>Start workout</button>
        </div>
      </section>
    </div>
  )

  const ProgressScreen = () => {
    const chartData = [...data.health].filter(h => h.weight).sort((a,b) => a.date.localeCompare(b.date)).slice(-12)
    return (
      <div className="stack">
        <div className="stat-grid">
          <StatCard value={streak.current} label="Current streak" />
          <StatCard value={streak.longest} label="Longest streak" />
          <StatCard value={(minutes / 60).toFixed(1)} label="Hours trained" />
          <StatCard value={data.workouts.filter(w => w.date.startsWith(today().slice(0,7))).length} label="This month" />
        </div>
        <section className="card">
          <h2>Weight trend</h2>
          <div className="chart-wrap">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#167f73" strokeWidth={4} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="muted">Add at least two weight entries to see a trend.</p>}
          </div>
        </section>
        <section className="card">
          <div className="section-header"><h2>Workout history</h2><button className="btn secondary" onClick={exportCsv}>Export CSV</button></div>
          <div className="history-list">
            {data.workouts.length ? data.workouts.map((w, i) => (
              <div className="history-row" key={`${w.date}-${i}`}><strong>{w.date}</strong><span>{w.rounds} rounds · {w.minutes} min {w.notes ? `· ${w.notes}` : ''}</span></div>
            )) : <p className="muted">No workouts logged yet.</p>}
          </div>
        </section>
      </div>
    )
  }

  const HealthScreen = () => (
    <div className="stack">
      <form className="card form-grid" onSubmit={saveHealth}>
        <h2>Health entry</h2>
        <label>Date<input name="date" type="date" defaultValue={today()} required /></label>
        <label>Weight (lb)<input name="weight" type="number" step="0.1" /></label>
        <label>Waist (inches)<input name="waist" type="number" step="0.1" /></label>
        <label>Protein (g)<input name="protein" type="number" /></label>
        <label>Water (oz)<input name="water" type="number" /></label>
        <label>Blood pressure<input name="bp" placeholder="120/80" /></label>
        <label className="wide">Notes<textarea name="notes" /></label>
        <button className="btn primary wide" type="submit">Save entry</button>
      </form>
      <section className="card">
        <h2>Health history</h2>
        <div className="history-list">
          {[...data.health].sort((a,b) => b.date.localeCompare(a.date)).map((h, i) => (
            <div className="history-row" key={`${h.date}-${i}`}><strong>{h.date}</strong><span>{[h.weight && `${h.weight} lb`,h.waist && `${h.waist}" waist`,h.protein && `${h.protein}g protein`,h.water && `${h.water} oz`,h.bp && `BP ${h.bp}`,h.notes].filter(Boolean).join(' · ')}</span></div>
          ))}
        </div>
      </section>
    </div>
  )

  const SettingsScreen = () => (
    <form className="card form-grid" onSubmit={saveSettings}>
      <h2>Settings</h2>
      <label>Workout rounds<select name="rounds" defaultValue={data.settings.rounds}><option>2</option><option>3</option><option>4</option></select></label>
      <label>Protein goal<input name="proteinGoal" type="number" defaultValue={data.settings.proteinGoal} /></label>
      <label>Starting weight<input name="startWeight" type="number" step="0.1" defaultValue={data.settings.startWeight} /></label>
      <label>Goal weight<input name="goalWeight" type="number" step="0.1" defaultValue={data.settings.goalWeight} /></label>
      <label>Weekly workout goal<input name="weeklyGoal" type="number" min="1" max="7" defaultValue={data.settings.weeklyGoal} /></label>
      <button className="btn primary wide" type="submit">Save settings</button>
    </form>
  )

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <small>GregFit</small>
          <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, Greg</h1>
          <p>Your personal strength and health tracker</p>
        </div>
        <div className="streak-card"><strong>{streak.current}</strong><span>day streak 🔥</span></div>
      </header>

      <main>
        {screen === 'home' && <HomeScreen />}
        {screen === 'workout' && <WorkoutPlayer settings={data.settings} session={data.session} setSession={session => patch(prev => ({ ...prev, session }))} onFinish={finishWorkout} />}
        {screen === 'progress' && <ProgressScreen />}
        {screen === 'health' && <HealthScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </main>

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  )
}
