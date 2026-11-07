/** Two paths meet at a shared passage: the Inoagent route mark. */
export function BrandMark({className = ''}: {className?: string}) {
  return <svg className={`brand-mark ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M8 34V18a10 10 0 0 1 10-10h12v10H18v16H8Z" fill="currentColor"/>
    <path d="M40 14v16a10 10 0 0 1-10 10H18V30h12V14h10Z" fill="currentColor"/>
    <path d="m20 24 4-4 4 4-4 4-4-4Z" className="brand-junction"/>
  </svg>
}

export function Brand() {
  return <span className="brand-lockup"><BrandMark/><span className="brand-word">inoagent<span className="brand-vpn">vpn</span></span></span>
}

/** Decorative schematic, never communicates invented availability. */
export function RouteIllustration({compact = false}: {compact?: boolean}) {
  return <svg className={`route-illustration ${compact ? 'route-compact' : ''}`} viewBox="0 0 520 300" fill="none" aria-hidden="true">
    <g className="route-grid" stroke="currentColor" strokeWidth="1">
      <path d="M40 60h440M40 120h440M40 180h440M40 240h440M100 30v240M180 30v240M260 30v240M340 30v240M420 30v240"/>
      <circle cx="260" cy="150" r="112"/><ellipse cx="260" cy="150" rx="58" ry="112"/><path d="M148 150h224"/>
    </g>
    <path className="route-track" d="M78 202h66a28 28 0 0 0 28-28v-44a28 28 0 0 1 28-28h120a28 28 0 0 1 28 28v44a28 28 0 0 0 28 28h66"/>
    <path className="route-travel" d="M78 202h66a28 28 0 0 0 28-28v-44a28 28 0 0 1 28-28h120a28 28 0 0 1 28 28v44a28 28 0 0 0 28 28h66"/>
    <g className="route-terminal"><rect x="44" y="178" width="48" height="48" rx="12"/><path d="M59 190h18v21H59zM64 216h8"/></g>
    <g className="route-terminal"><rect x="428" y="178" width="48" height="48" rx="12"/><path d="M440 190h24v10h-24zM440 205h24v10h-24zM458 195h2M458 210h2"/></g>
    <g className="route-passage"><rect x="233" y="75" width="54" height="54" rx="14"/><path d="M246 110V92h18v8h-10v10M274 92v18h-18v-8h10V92"/></g>
    <circle className="route-point" cx="172" cy="150" r="4"/><circle className="route-point" cx="348" cy="150" r="4"/>
  </svg>
}
