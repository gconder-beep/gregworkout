import { useEffect, useMemo, useState } from 'react'
import { exercises } from '../data/exercises'

export default function WorkoutPlayer({ settings, session, setSession, onFinish }) {
  const [rest, setRest] = useState(60)
  const [running, setRunning] = useState(false)
  const exercise = exercises[session.index]
  const rounds = Number(settings.rounds || 3)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRest(v => {
        if (v <= 1) {
          setRunning(false)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const next = () => {
    const key = `${session.round}-${session.index}`
    const completed = session.completed.includes(key) ? session.completed : [...session.completed, key]
    if (session.index < exercises.length - 1) {
      setSession({ ...session, index: session.index + 1, completed, startedAt: session.startedAt || Date.now() })
      return
    }
    if (session.round < rounds) {
      setSession({ ...session, round: session.round + 1, index: 0, completed, startedAt: session.startedAt || Date.now() })
      setRest(60)
      return
    }
    onFinish({ ...session, completed, startedAt: session.startedAt || Date.now() })
  }

  const prev = () => {
    if (session.index > 0) setSession({ ...session, index: session.index - 1 })
    else if (session.round > 1) setSession({ ...session, round: session.round - 1, index: exercises.length - 1 })
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="player-header">
          <div>
            <span className="badge">{exercise.category}</span>
            <h2>{exercise.name}</h2>
            <p>{exercise.target} · {exercise.weight}</p>
          </div>
          <div className="round-box">
            <strong>Round {session.round}/{rounds}</strong>
            <span>Exercise {session.index + 1}/{exercises.length}</span>
          </div>
        </div>

        <div className="exercise-image">
          <img src={`${import.meta.env.BASE_URL}assets/illustrations/${exercise.image}`} alt={`${exercise.name} illustration`} />
        </div>

        <div className="cue">{exercise.cue}</div>
        <div className="button-row">
          <button className="btn secondary" onClick={prev} disabled={session.round === 1 && session.index === 0}>Previous</button>
          <button className="btn primary" onClick={next}>
            {session.round === rounds && session.index === exercises.length - 1 ? 'Finish workout' : 'Complete & Next'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="timer">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</div>
        <div className="button-row">
          <button className="btn secondary" onClick={() => { setRest(30); setRunning(false) }}>30 sec</button>
          <button className="btn secondary" onClick={() => { setRest(60); setRunning(false) }}>60 sec</button>
        </div>
        <button className="btn primary full" onClick={() => setRunning(v => !v)}>{running ? 'Pause timer' : 'Start rest timer'}</button>
      </section>

      <section className="sequence-list">
        {exercises.map((item, i) => (
          <button key={item.id} className={i === session.index ? 'sequence active' : 'sequence'} onClick={() => setSession({ ...session, index: i })}>
            <span>{session.completed.includes(`${session.round}-${i}`) ? '✓' : i + 1}</span>
            <div><strong>{item.name}</strong><small>{item.target} · {item.weight}</small></div>
          </button>
        ))}
      </section>
    </div>
  )
}
