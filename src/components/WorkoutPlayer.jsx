import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { exercises } from '../data/exercises'

function speak(text, enabled) {
  if (!enabled || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  speechSynthesis.speak(utterance)
}

export default function WorkoutPlayer({ settings, session, setSession, onFinish }) {
  const [rest, setRest] = useState(60)
  const [running, setRunning] = useState(false)
  const [voice, setVoice] = useState(settings.voice !== false)
  const exercise = exercises[session.index]
  const rounds = Number(settings.rounds || 3)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRest(v => {
        if (v === 4) speak('Three, two, one', voice)
        if (v <= 1) {
          setRunning(false)
          speak('Rest complete. Begin the next exercise.', voice)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, voice])

  useEffect(() => {
    speak(`${exercise.name}. ${exercise.target}.`, voice)
  }, [exercise.id])

  const beginRest = () => {
    setRest(Number(settings.restSeconds || 60))
    setRunning(true)
  }

  const next = () => {
    const key = `${session.round}-${session.index}`
    const completed = session.completed.includes(key) ? session.completed : [...session.completed, key]
    if (session.index < exercises.length - 1) {
      setSession({ ...session, index: session.index + 1, completed, startedAt: session.startedAt || Date.now() })
      beginRest()
      return
    }
    if (session.round < rounds) {
      setSession({ ...session, round: session.round + 1, index: 0, completed, startedAt: session.startedAt || Date.now() })
      beginRest()
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
      <section className="card workout-player-card">
        <div className="player-header">
          <div>
            <span className="badge">{exercise.category}</span>
            <h2>{exercise.name}</h2>
            <p>{exercise.target} · {exercise.weight}</p>
          </div>
          <div className="player-actions">
            <button className="icon-btn" aria-label="Toggle voice cues" onClick={() => setVoice(v => !v)}>
              {voice ? <Volume2 size={21} /> : <VolumeX size={21} />}
            </button>
            <div className="round-box">
              <strong>Round {session.round}/{rounds}</strong>
              <span>Exercise {session.index + 1}/{exercises.length}</span>
            </div>
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

      <section className="card rest-card">
        <span className="badge">Rest timer</span>
        <div className="timer">{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</div>
        <div className="button-row">
          <button className="btn secondary" onClick={() => { setRest(30); setRunning(false) }}>30 sec</button>
          <button className="btn secondary" onClick={() => { setRest(60); setRunning(false) }}>60 sec</button>
        </div>
        <button className="btn primary full" onClick={() => setRunning(v => !v)}>{running ? 'Pause timer' : rest === 0 ? 'Restart timer' : 'Start rest timer'}</button>
      </section>

      <section>
        <div className="section-header"><div><h2>Today’s sequence</h2><p className="muted">Tap any movement to jump to it</p></div></div>
        <div className="sequence-list">
          {exercises.map((item, i) => (
            <button key={item.id} className={i === session.index ? 'sequence active' : 'sequence'} onClick={() => setSession({ ...session, index: i })}>
              <span>{session.completed.includes(`${session.round}-${i}`) ? '✓' : i + 1}</span>
              <div><strong>{item.name}</strong><small>{item.target} · {item.weight}</small></div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
