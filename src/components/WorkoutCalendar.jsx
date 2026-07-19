export default function WorkoutCalendar({ workouts }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const done = new Set(workouts.map(w => w.date))
  const cells = []

  for (let i = 0; i < first.getDay(); i++) cells.push(<div key={`blank-${i}`} />)
  for (let day = 1; day <= last.getDate(); day++) {
    const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    cells.push(
      <div key={key} className={done.has(key) ? 'calendar-day done' : 'calendar-day'}>
        <span>{day}</span>
        {done.has(key) && <b>✓</b>}
      </div>
    )
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h2>Workout calendar</h2>
          <p className="muted">{now.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="calendar-grid">
        {['S','M','T','W','T','F','S'].map((d,i) => <div className="calendar-label" key={`${d}-${i}`}>{d}</div>)}
        {cells}
      </div>
    </section>
  )
}
