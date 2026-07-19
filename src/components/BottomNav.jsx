import { Home, Dumbbell, TrendingUp, Heart, Settings } from 'lucide-react'

const items = [
  ['home', Home, 'Home'],
  ['workout', Dumbbell, 'Workout'],
  ['progress', TrendingUp, 'Progress'],
  ['health', Heart, 'Health'],
  ['settings', Settings, 'Settings'],
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {items.map(([id, Icon, label]) => (
        <button key={id} className={active === id ? 'nav-item active' : 'nav-item'} onClick={() => onChange(id)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
