import { useEffect, useState } from 'react'
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { exercises } from '../data/exercises'

function speak(text, enabled) {
  if (!enabled || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = .95
  speechSynthesis.speak(u)
}

export default function WorkoutPlayer({ settings, session, setSession, onFinish }) {
  const [rest, setRest] = useState(Number(settings.restSeconds || 60))
  const [running, setRunning] = useState(false)
  const [voice, setVoice] = useState(settings.voice !== false)
  const exercise = exercises[session.index]
  const rounds = Number(settings.rounds || 3)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRest(v => {
        if(v===4) speak('Three, two, one',voice)
        if(v<=1){setRunning(false);speak('Rest complete',voice);return 0}
        return v-1
      })
    },1000)
    return ()=>clearInterval(id)
  },[running,voice])

  useEffect(()=>{speak(`${exercise.name}. ${exercise.target}`,voice)},[exercise.id])

  const next = () => {
    const key = `${session.round}-${session.index}`
    const completed = session.completed.includes(key)?session.completed:[...session.completed,key]
    if(session.index<exercises.length-1){
      setSession({...session,index:session.index+1,completed,startedAt:session.startedAt||Date.now()})
      setRest(Number(settings.restSeconds||60));setRunning(true);return
    }
    if(session.round<rounds){
      setSession({...session,round:session.round+1,index:0,completed,startedAt:session.startedAt||Date.now()})
      setRest(Number(settings.restSeconds||60));setRunning(true);return
    }
    onFinish({...session,completed,startedAt:session.startedAt||Date.now()})
  }

  const prev=()=>{if(session.index>0)setSession({...session,index:session.index-1});else if(session.round>1)setSession({...session,round:session.round-1,index:exercises.length-1})}

  return <div className="workout-layout">
    <section className="panel workout-stage">
      <div className="workout-top"><button className="icon-btn" onClick={prev}><ChevronLeft/></button><div><h2>Greg’s Full-Body Circuit</h2><span>{session.index+1} of {exercises.length}</span></div><button className="icon-btn" onClick={()=>setVoice(v=>!v)}>{voice?<Volume2/>:<VolumeX/>}</button></div>
      <div className="bar"><div style={{width:`${((session.index)/(exercises.length))*100}%`}}/></div>
      <div className="exercise-title"><span className="pill">{exercise.category}</span><h1>{exercise.name}</h1><p>{exercise.target} · {exercise.weight}</p></div>
      <div className="exercise-hero"><img src={`${import.meta.env.BASE_URL}assets/illustrations/${exercise.image}`} alt={`${exercise.name} illustration`}/></div>
      <p className="exercise-cue">{exercise.cue}</p>
      <div className="workout-timer-row">
        <div><span>WORK</span><strong>{exercise.target}</strong></div>
        <button className="timer-circle" onClick={()=>setRunning(v=>!v)}><b>{Math.floor(rest/60)}:{String(rest%60).padStart(2,'0')}</b><small>{running?'Tap to pause':'Tap to start'}</small></button>
        <div><span>REST</span><strong>{settings.restSeconds}s</strong></div>
      </div>
      <div className="player-buttons"><button className="ghost-btn" onClick={prev}><ChevronLeft/>Previous</button><button className="primary-btn" onClick={next}>Next<ChevronRight/></button></div>
    </section>
    <aside className="panel workout-info">
      <h3>About</h3>
      <h2>{exercise.name}</h2>
      <span className="muscle-tag">{exercise.category}</span>
      <ul>
        <li>Use controlled movement and steady breathing.</li>
        <li>Stop if you feel sharp pain or dizziness.</li>
        <li>Keep the kettlebell weight appropriate for good form.</li>
      </ul>
      <div className="sequence-mini">{exercises.map((e,i)=><button key={e.id} className={i===session.index?'active':''} onClick={()=>setSession({...session,index:i})}><span>{session.completed.includes(`${session.round}-${i}`)?'✓':i+1}</span><div><b>{e.name}</b><small>{e.target}</small></div></button>)}</div>
    </aside>
  </div>
}
