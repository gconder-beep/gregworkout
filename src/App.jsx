import { useMemo, useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Home, Dumbbell, CalendarDays, TrendingUp, Heart, Utensils, Image, Trophy, Target, Settings, Droplets, ChevronRight, Play, Flame, Clock3, Scale, Volume2, VolumeX } from 'lucide-react'
import WorkoutPlayer from './components/WorkoutPlayer'
import WorkoutCalendar from './components/WorkoutCalendar'
import ProgressPhotos from './components/ProgressPhotos'
import { exercises } from './data/exercises'
import { usePersistentState } from './hooks/usePersistentState'
import './styles/app.css'

const defaults = {
  settings: { rounds: 3, proteinGoal: 180, waterGoal: 100, startWeight: '', goalWeight: 250, weeklyGoal: 3, restSeconds: 60, voice: true },
  workouts: [],
  health: [],
  photos: [],
  session: { round: 1, index: 0, completed: [], startedAt: null }
}

const navItems = [
  ['home', Home, 'Dashboard'],
  ['workout', Dumbbell, 'Workouts'],
  ['calendar', CalendarDays, 'Calendar'],
  ['progress', TrendingUp, 'Progress'],
  ['health', Heart, 'Health'],
  ['nutrition', Utensils, 'Nutrition'],
  ['photos', Image, 'Photos'],
  ['records', Trophy, 'PRs'],
  ['goals', Target, 'Goals'],
  ['settings', Settings, 'Settings'],
]

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

function download(name, content, type='application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [rawData, setData] = usePersistentState('gregfit_v6', defaults)
  const data = { ...defaults, ...rawData, settings: { ...defaults.settings, ...(rawData.settings || {}) }, photos: rawData.photos || [] }
  const streak = useMemo(() => calcStreak(data.workouts), [data.workouts])
  const latestHealth = [...data.health].sort((a,b) => b.date.localeCompare(a.date))[0] || {}
  const todayHealth = data.health.find(h => h.date === today()) || {}
  const totalMinutes = data.workouts.reduce((sum, w) => sum + Number(w.minutes || 0), 0)
  const progressPct = Math.round((data.session.completed.length / (Number(data.settings.rounds) * exercises.length)) * 100) || 0
  const monthCount = data.workouts.filter(w => w.date.startsWith(today().slice(0,7))).length
  const latestWeight = Number(latestHealth.weight || 0)
  const goalWeight = Number(data.settings.goalWeight || 0)
  const milestones = latestWeight && goalWeight ? Array.from({length:5},(_,i)=>Math.max(goalWeight, Math.floor(latestWeight/5)*5 - i*5)) : [265,260,255,250]

  const patch = updater => setData(prev => typeof updater === 'function' ? updater(prev) : updater)

  const finishWorkout = session => {
    const end = Date.now()
    const note = window.prompt('Workout complete! Add an optional note:') || ''
    const workout = {
      date: today(),
      minutes: Math.max(1, Math.round((end - session.startedAt) / 60000)),
      rounds: Number(data.settings.rounds),
      notes: note,
      exercises: exercises.length * Number(data.settings.rounds)
    }
    patch(prev => ({ ...prev, workouts:[workout,...prev.workouts], session:{ round:1,index:0,completed:[],startedAt:null } }))
    setScreen('home')
  }

  const saveHealth = e => {
    e.preventDefault()
    const entry = Object.fromEntries(new FormData(e.currentTarget).entries())
    patch(prev => ({ ...prev, health:[...prev.health.filter(h=>h.date!==entry.date),entry] }))
    e.currentTarget.reset()
  }

  const saveSettings = e => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    patch(prev => ({ ...prev, settings:{ ...prev.settings, ...Object.fromEntries(form.entries()), voice:form.get('voice')==='on' } }))
  }

  const metricCards = [
    [Dumbbell, data.workouts.length, 'Total workouts', 'This month'],
    [Clock3, totalMinutes, 'Minutes trained', 'This month'],
    [Scale, latestHealth.weight ? `${latestHealth.weight}` : '—', 'Latest weight', latestHealth.weight ? 'lb' : 'No entries yet'],
    [Utensils, `${todayHealth.protein || 0}g`, 'Protein today', `of ${data.settings.proteinGoal}g goal`],
  ]

  const Dashboard = () => (
    <div className="page-grid">
      <section className="welcome-card panel">
        <div>
          <span className="eyebrow">GregFit v6.1</span>
          <h1>Good {new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening'}, Greg</h1>
          <p>Let’s crush your goals today.</p>
        </div>
        <div className="streak-orb"><Flame size={22}/><strong>{streak.current}</strong><span>day streak</span></div>
      </section>

      <section className="metric-grid">
        {metricCards.map(([Icon,value,label,sub]) => (
          <div className="metric panel" key={label}>
            <Icon size={22}/><strong>{value}</strong><span>{label}</span><small>{sub}</small>
          </div>
        ))}
      </section>

      <section className="workout-card panel">
        <div className="workout-figure">
          <img src={`${import.meta.env.BASE_URL}assets/illustrations/swing.svg`} alt="Kettlebell swing illustration" />
        </div>
        <div className="workout-copy">
          <span className="pill">Today’s workout</span>
          <h2>Greg’s Full-Body Circuit</h2>
          <p>9 exercises · About 25–35 minutes</p>
          <div className="bar"><div style={{width:`${progressPct}%`}}/></div>
          <b>{progressPct}% complete</b>
          <button className="primary-btn" onClick={()=>setScreen('workout')}><Play size={17} fill="currentColor"/>{progressPct?'Continue workout':'Start workout'}</button>
          <button className="ghost-btn" onClick={()=>setScreen('workout')}>View workout details <ChevronRight size={16}/></button>
        </div>
      </section>

      <section className="two-col">
        <div className="panel goal-panel">
          <div className="section-head"><div><h3><Utensils size={19}/>Protein</h3><span>Daily goal</span></div><b>{todayHealth.protein||0}/{data.settings.proteinGoal}g</b></div>
          <div className="bar"><div style={{width:`${Math.min(100,Number(todayHealth.protein||0)/Number(data.settings.proteinGoal||1)*100)}%`}}/></div>
          <button onClick={()=>setScreen('nutrition')}>+ Add food</button>
        </div>
        <div className="panel goal-panel">
          <div className="section-head"><div><h3><Droplets size={19}/>Water</h3><span>Daily goal</span></div><b>{todayHealth.water||0}/{data.settings.waterGoal} oz</b></div>
          <div className="bar water"><div style={{width:`${Math.min(100,Number(todayHealth.water||0)/Number(data.settings.waterGoal||1)*100)}%`}}/></div>
          <button className="blue" onClick={()=>setScreen('nutrition')}>+ Add water</button>
        </div>
      </section>

      <section className="dashboard-lower">
        <WorkoutCalendar workouts={data.workouts}/>
        <section className="panel">
          <div className="section-head"><div><h3><Trophy size={19}/>Personal Records</h3><span>Best performances</span></div></div>
          <div className="pr-list">
            <div><span>Most workouts in month</span><b>{monthCount}</b></div>
            <div><span>Longest workout</span><b>{Math.max(0,...data.workouts.map(w=>Number(w.minutes||0)))} min</b></div>
            <div><span>Longest streak</span><b>{streak.longest} days</b></div>
            <div><span>Total exercises</span><b>{data.workouts.reduce((s,w)=>s+Number(w.exercises||0),0)}</b></div>
          </div>
        </section>
        <section className="panel">
          <div className="section-head"><div><h3><TrendingUp size={19}/>Weight Trend</h3><span>{latestHealth.weight?'Recent progress':'No data yet'}</span></div></div>
          <WeightChart data={data.health}/>
        </section>
        <section className="panel">
          <div className="section-head"><div><h3><Target size={19}/>Goals</h3><span>Edit goals in settings</span></div></div>
          <div className="goal-list">{milestones.map(m=><div key={m}><Trophy size={17}/><span>{m} lbs</span><b>—</b></div>)}</div>
        </section>
      </section>
    </div>
  )

  const WeightChart = ({data}) => {
    const chart = [...data].filter(h=>h.weight).sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)
    if(chart.length<2) return <div className="empty-chart">Add two weight entries to see a chart.</div>
    return <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><XAxis dataKey="date" hide/><YAxis domain={['dataMin - 2','dataMax + 2']} width={38}/><Tooltip contentStyle={{background:'#0e1a27',border:'1px solid #1f3948',borderRadius:12}}/><Line type="monotone" dataKey="weight" stroke="#22c78a" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer></div>
  }

  const ProgressPage = () => (
    <div className="stack">
      <section className="metric-grid">
        {[[streak.current,'Current streak'],[streak.longest,'Longest streak'],[(totalMinutes/60).toFixed(1),'Hours trained'],[monthCount,'This month']].map(([v,l])=><div className="metric panel" key={l}><strong>{v}</strong><span>{l}</span></div>)}
      </section>
      <WorkoutCalendar workouts={data.workouts}/>
      <section className="panel"><div className="section-head"><div><h3>Weight trend</h3><span>Most recent entries</span></div></div><WeightChart data={data.health}/></section>
      <section className="panel"><div className="section-head"><div><h3>Workout history</h3><span>Saved sessions</span></div><button onClick={()=>download(`gregfit-${today()}.json`,JSON.stringify(data,null,2))}>Backup</button></div><div className="history">{data.workouts.length?data.workouts.map((w,i)=><div key={i}><b>{w.date}</b><span>{w.rounds} rounds · {w.minutes} min {w.notes?`· ${w.notes}`:''}</span></div>):<p>No workouts logged yet.</p>}</div></section>
    </div>
  )

  const HealthPage = () => (
    <div className="stack">
      <form className="panel form" onSubmit={saveHealth}>
        <div className="form-title"><h2>Health entry</h2><p>Log body measurements and daily nutrition.</p></div>
        <label>Date<input name="date" type="date" defaultValue={today()} required/></label>
        <label>Weight (lb)<input name="weight" type="number" step="0.1"/></label>
        <label>Waist (inches)<input name="waist" type="number" step="0.1"/></label>
        <label>Protein (g)<input name="protein" type="number"/></label>
        <label>Water (oz)<input name="water" type="number"/></label>
        <label>Blood pressure<input name="bp" placeholder="120/80"/></label>
        <label className="wide">Notes<textarea name="notes" placeholder="Sleep, energy, soreness, recovery..."/></label>
        <button className="primary-btn wide" type="submit">Save entry</button>
      </form>
      <section className="panel"><div className="section-head"><div><h3>Health history</h3><span>Recent entries</span></div></div><div className="history">{[...data.health].sort((a,b)=>b.date.localeCompare(a.date)).map((h,i)=><div key={i}><b>{h.date}</b><span>{[h.weight&&`${h.weight} lb`,h.waist&&`${h.waist}" waist`,h.protein&&`${h.protein}g protein`,h.water&&`${h.water} oz`,h.bp&&`BP ${h.bp}`,h.notes].filter(Boolean).join(' · ')}</span></div>)}</div></section>
    </div>
  )

  const NutritionPage = () => <HealthPage/>

  const RecordsPage = () => (
    <div className="stack">
      <section className="panel"><div className="section-head"><div><h3>Personal records</h3><span>Your best saved performances</span></div></div>
      <div className="record-grid">
        <div><Trophy/><strong>{Math.max(0,...data.workouts.map(w=>Number(w.rounds||0)))}</strong><span>Most rounds</span></div>
        <div><Clock3/><strong>{Math.max(0,...data.workouts.map(w=>Number(w.minutes||0)))}</strong><span>Longest workout</span></div>
        <div><Flame/><strong>{streak.longest}</strong><span>Longest streak</span></div>
        <div><Dumbbell/><strong>{data.workouts.reduce((s,w)=>s+Number(w.exercises||0),0)}</strong><span>Total exercises</span></div>
      </div></section>
    </div>
  )

  const GoalsPage = () => <SettingsPage/>

  const SettingsPage = () => (
    <form className="panel form" onSubmit={saveSettings}>
      <div className="form-title"><h2>Settings</h2><p>Customize your workout and daily goals.</p></div>
      <label>Workout rounds<select name="rounds" defaultValue={data.settings.rounds}><option>2</option><option>3</option><option>4</option></select></label>
      <label>Rest time<select name="restSeconds" defaultValue={data.settings.restSeconds}><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option><option value="90">90 seconds</option></select></label>
      <label>Protein goal<input name="proteinGoal" type="number" defaultValue={data.settings.proteinGoal}/></label>
      <label>Water goal<input name="waterGoal" type="number" defaultValue={data.settings.waterGoal}/></label>
      <label>Starting weight<input name="startWeight" type="number" step="0.1" defaultValue={data.settings.startWeight}/></label>
      <label>Goal weight<input name="goalWeight" type="number" step="0.1" defaultValue={data.settings.goalWeight}/></label>
      <label>Weekly workout goal<input name="weeklyGoal" type="number" min="1" max="7" defaultValue={data.settings.weeklyGoal}/></label>
      <label className="toggle"><input name="voice" type="checkbox" defaultChecked={data.settings.voice!==false}/><span>Voice exercise cues</span></label>
      <button className="primary-btn wide" type="submit">Save settings</button>
      <button className="danger-btn wide" type="button" onClick={()=>{if(confirm('Reset all GregFit v6.1 data?')){localStorage.removeItem('gregfit_v6');location.reload()}}}>Reset all data</button>
    </form>
  )

  const renderScreen = () => {
    if(screen==='home') return <Dashboard/>
    if(screen==='workout') return <WorkoutPlayer settings={data.settings} session={data.session} setSession={session=>patch(prev=>({...prev,session}))} onFinish={finishWorkout}/>
    if(screen==='calendar') return <WorkoutCalendar workouts={data.workouts}/>
    if(screen==='progress') return <ProgressPage/>
    if(screen==='health') return <HealthPage/>
    if(screen==='nutrition') return <NutritionPage/>
    if(screen==='photos') return <ProgressPhotos photos={data.photos} onChange={photos=>patch(prev=>({...prev,photos}))}/>
    if(screen==='records') return <RecordsPage/>
    if(screen==='goals') return <GoalsPage/>
    return <SettingsPage/>
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">G</div><strong>GregFit <small>v6</small></strong></div>
        <nav>{navItems.map(([id,Icon,label])=><button key={id} className={screen===id?'active':''} onClick={()=>setScreen(id)}><Icon size={19}/><span>{label}</span></button>)}</nav>
        <div className="version-card"><span>Upgrade complete!</span><small>You’re running the latest version.</small><b>v6.1.0 ✓</b></div>
      </aside>
      <main className="main">{renderScreen()}</main>
      <nav className="mobile-nav">
        {navItems.slice(0,5).map(([id,Icon,label])=><button key={id} className={screen===id?'active':''} onClick={()=>setScreen(id)}><Icon size={19}/><span>{label}</span></button>)}
      </nav>
    </div>
  )
}
