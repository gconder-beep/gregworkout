export default function WorkoutCalendar({ workouts }) {
  const now=new Date(),year=now.getFullYear(),month=now.getMonth(),first=new Date(year,month,1),last=new Date(year,month+1,0)
  const done=new Set(workouts.map(w=>w.date)),cells=[]
  for(let i=0;i<first.getDay();i++)cells.push(<div key={`b${i}`}/>)
  for(let d=1;d<=last.getDate();d++){
    const key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push(<div key={key} className={done.has(key)?'calendar-day done':'calendar-day'}><span>{d}</span></div>)
  }
  return <section className="panel calendar-panel"><div className="section-head"><div><h3>{now.toLocaleString(undefined,{month:'long',year:'numeric'})}</h3><span>Workout calendar</span></div></div><div className="calendar-grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div className="calendar-label" key={d}>{d}</div>)}{cells}</div><div className="legend"><span><i className="green"/>Workout</span><span><i className="blue"/>Logged</span><span><i className="gray"/>No data</span></div></section>
}
