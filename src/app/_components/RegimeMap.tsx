export default function RegimeMap() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/50 p-5 ring-accent">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-neutral-300">Regime map (sketch)</div>
        <div className="text-xs text-neutral-500">illustrative</div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-neutral-950">
        <svg viewBox="0 0 820 360" className="w-full h-auto">
          <defs>
            <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="820" height="360" fill="url(#fade)" />

          <g fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1">
            <line x1="60" y1="50" x2="60" y2="310" />
            <line x1="60" y1="310" x2="760" y2="310" />
          </g>

          <g fill="rgba(255,255,255,0.75)" fontSize="12" fontFamily="ui-sans-serif, system-ui">
            <text x="60" y="32">↑ scarcity</text>
            <text x="60" y="46">↓ legitimacy</text>
            <text x="650" y="332">↑ metric pressure / media fragmentation →</text>
          </g>

          <g fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="1">
            <rect x="120" y="90" width="220" height="70" rx="10" />
            <rect x="420" y="90" width="260" height="70" rx="10" />
            <rect x="120" y="190" width="260" height="70" rx="10" />
            <rect x="420" y="190" width="260" height="70" rx="10" />
            <rect x="260" y="270" width="320" height="60" rx="10" />
          </g>

          <g fill="rgba(255,255,255,0.85)" fontSize="14" fontFamily="ui-serif, Georgia, serif">
            <text x="140" y="120">Managerial Normality</text>
            <text x="440" y="120">Performative Care</text>
            <text x="140" y="220">Factionalization</text>
            <text x="440" y="220">Legibility Collapse</text>
            <text x="280" y="305">Violence as Communication</text>
          </g>

          <g fill="none" stroke="rgba(125,211,252,0.35)" strokeWidth="2">
            <path d="M340 125 L420 125" />
            <path d="M250 160 L250 190" />
            <path d="M550 160 L550 190" />
            <path d="M250 260 L420 300" />
          </g>
        </svg>
      </div>

      <div className="mt-3 text-sm text-neutral-400 leading-relaxed">
        The point is constraint: which internal mechanisms must exist for each region
        to be a stable attractor under its circumstances.
      </div>
    </div>
  )
}
