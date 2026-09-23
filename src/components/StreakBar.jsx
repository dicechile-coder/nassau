// Compact XP / streak / freeze summary for the hub and the result screen.
export default function StreakBar({ p, compact = false }) {
  if (!p) return null
  const days = p.streak === 1 ? '1-day streak' : `${p.streak}-day streak`
  return (
    <div className="streakbar">
      <span className={`pill ${p.streak > 0 ? 'pill-fire' : ''}`} title="Days in a row with practice">🔥 {days}</span>
      <span className="pill" title="Experience points">⭐ {p.xp} XP</span>
      {!compact && (
        <span className="pill" title="One missed day per week is forgiven automatically">
          🧊 {p.freeze_available ? 'Streak freeze ready' : 'Freeze used this week'}
        </span>
      )}
      {!compact && !p.active_today && (
        <span className="small muted streak-note">
          {p.at_risk
            ? 'You missed yesterday — your streak freeze saves it if you practise today.'
            : p.streak > 0 ? 'Practise today to keep your streak.' : 'Answer one exercise today to start a streak.'}
        </span>
      )}
    </div>
  )
}
