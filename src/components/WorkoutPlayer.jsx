import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { exercises } from '../data/exercises'

export default function WorkoutPlayer({ settings, session, setSession, onFinish }) {
  const [rest, setRest] = useState(Number(settings.restSeconds || 60))
  const [running, setRunning] = useState(false)
  const exercise = exercises[session.index]
  const rounds = Number(settings.rounds || 3)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRest(value => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const next = () => {
    const key = `${session.round}-${session.index}`
    const completed = session.completed.includes(key) ? session.completed : [...session.completed, key]

    if (session.index < exercises.length - 1) {
      setSession({ ...session, index: session.index + 1, completed, startedAt: session.startedAt || Date.now() })
      setRest(Number(settings.restSeconds || 60))
      setRunning(true)
      return
    }

    if (session.round < rounds) {
      setSession({ ...session, round: session.round + 1, index: 0, completed, startedAt: session.startedAt || Date.now() })
      setRest(Number(settings.restSeconds || 60))
      setRunning(true)
      return
    }

    onFinish({ ...session, completed, startedAt: session.startedAt || Date.now() })
  }

  const previous = () => {
    if (session.index > 0) setSession({ ...session, index: session.index - 1 })
    else if (session.round > 1) setSession({ ...session, round: session.round - 1, index: exercises.length - 1 })
  }

  return (
    <div className="workout-layout">
      <section className="panel workout-stage">
        <div className="workout-top">
          <button className="icon-btn" onClick={previous} aria-label="Previous exercise"><ChevronLeft /></button>
          <div>
            <h2>Greg’s Full-Body Circuit</h2>
            <span>{session.index + 1} of {exercises.length} · Round {session.round} of {rounds}</span>
          </div>
          <div className="icon-btn exercise-count">{session.index + 1}</div>
        </div>

        <div className="bar"><div style={{ width: `${((session.index + 1) / exercises.length) * 100}%` }} /></div>

        <div className="exercise-title">
          <span className="pill">{exercise.category}</span>
          <h1>{exercise.name}</h1>
          <p>{exercise.target} · {exercise.weight}</p>
        </div>

        <div className="exercise-hero realistic">
          <img src={`${import.meta.env.BASE_URL}assets/illustrations/${exercise.image}`} alt={`${exercise.name} demonstration`} />
        </div>

        <p className="exercise-cue">{exercise.cue}</p>

        <div className="workout-timer-row">
          <div><span>WORK</span><strong>{exercise.target}</strong></div>
          <button className="timer-circle" onClick={() => setRunning(value => !value)}>
            <b>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</b>
            <small>{running ? 'Tap to pause' : 'Tap to start'}</small>
          </button>
          <div><span>REST</span><strong>{settings.restSeconds}s</strong></div>
        </div>

        <div className="player-buttons">
          <button className="ghost-btn" onClick={previous}><ChevronLeft />Previous</button>
          <button className="primary-btn" onClick={next}>Next<ChevronRight /></button>
        </div>
      </section>

      <aside className="panel workout-info">
        <h3>About</h3>
        <h2>{exercise.name}</h2>
        <span className="muscle-tag">{exercise.category}</span>
        <ul>
          <li>Use controlled movement and steady breathing.</li>
          <li>Choose a weight that allows good form.</li>
          <li>Stop if you feel sharp pain, dizziness, or unusual shortness of breath.</li>
        </ul>

        <div className="sequence-mini">
          {exercises.map((item, index) => (
            <button key={item.id} className={index === session.index ? 'active' : ''} onClick={() => setSession({ ...session, index })}>
              <span>{session.completed.includes(`${session.round}-${index}`) ? '✓' : index + 1}</span>
              <div><b>{item.name}</b><small>{item.target}</small></div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
