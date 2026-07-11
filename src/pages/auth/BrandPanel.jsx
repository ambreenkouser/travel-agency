// Major city coordinates [x, y, label] on the 800×450 map
const CITIES = [
  [120, 138, 'New York'],
  [314, 88,  'London'],
  [332, 84,  'Paris'],
  [408, 148, 'Dubai'],
  [463, 168, 'Karachi'],
  [569, 192, 'Singapore'],
  [638, 108, 'Tokyo'],
  [628, 318, 'Sydney'],
  [476, 158, 'Mumbai'],
]

// Flight route arcs [x1,y1, cx,cy, x2,y2, delay, duration]
const ROUTES = [
  { d: 'M 120,138 Q 215,48  314,88',  delay: '0s',   dur: '6s' },
  { d: 'M 314,88  Q 362,96  408,148', delay: '2s',   dur: '5s' },
  { d: 'M 408,148 Q 490,162 569,192', delay: '4s',   dur: '6s' },
  { d: 'M 569,192 Q 615,252 628,318', delay: '6s',   dur: '5s' },
  { d: 'M 120,138 Q 262,78  408,148', delay: '1s',   dur: '8s' },
  { d: 'M 314,88  Q 444,118 569,192', delay: '3s',   dur: '7s' },
  { d: 'M 408,148 Q 542,128 638,108', delay: '5s',   dur: '5s' },
  { d: 'M 463,168 Q 518,182 569,192', delay: '7s',   dur: '4s' },
]

export default function BrandPanel() {
  return (
    <div className="lp-left">

      {/* Radial glow blobs */}
      <div className="lp-glow" style={{
        width: 480, height: 480,
        top: '10%', left: '-10%',
        background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
      }} />
      <div className="lp-glow" style={{
        width: 320, height: 320,
        bottom: '10%', right: '5%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
      }} />

      {/* SVG world map + flight routes */}
      <svg
        className="lp-map-svg"
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Latitude grid lines */}
        {[60, 120, 180, 240, 300, 360, 420].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="800" y2={y} className="lp-grid" />
        ))}
        {/* Longitude grid lines */}
        {[80, 160, 240, 320, 400, 480, 560, 640, 720].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="450" className="lp-grid" />
        ))}

        {/* ── Simplified continents ── */}
        {/* North America */}
        <polygon className="lp-continent"
          points="70,68 82,56 120,52 158,58 185,72 205,92 218,128 215,168 200,198 178,210 155,208 138,188 128,158 92,148 72,120" />
        {/* Greenland */}
        <polygon className="lp-continent"
          points="162,28 198,22 215,38 208,58 182,64 162,50" />
        {/* South America */}
        <polygon className="lp-continent"
          points="168,218 212,212 234,238 242,278 228,328 204,368 182,348 170,300 158,258" />
        {/* Europe */}
        <polygon className="lp-continent"
          points="298,62 348,56 372,72 368,98 348,118 320,118 296,98 288,78" />
        {/* Africa */}
        <polygon className="lp-continent"
          points="292,128 358,122 394,142 402,188 392,248 368,298 340,318 298,308 278,268 272,218 282,168" />
        {/* Middle East */}
        <polygon className="lp-continent"
          points="362,128 408,122 428,148 418,174 392,180 362,165" />
        {/* Central Asia / Russia */}
        <polygon className="lp-continent"
          points="372,58 478,48 578,56 640,78 658,108 638,138 578,148 518,158 478,138 438,128 398,118 375,98" />
        {/* South Asia */}
        <polygon className="lp-continent"
          points="458,142 492,138 512,158 508,198 482,218 460,204 444,174" />
        {/* Southeast Asia */}
        <polygon className="lp-continent"
          points="518,162 568,156 598,172 588,198 558,204 528,194" />
        {/* East Asia */}
        <polygon className="lp-continent"
          points="538,78 598,72 648,82 668,108 648,138 608,148 568,142 538,118" />
        {/* Australia */}
        <polygon className="lp-continent"
          points="566,268 640,262 668,282 664,328 630,352 590,348 562,322 552,293" />

        {/* ── Flight routes ── */}
        {ROUTES.map((r, i) => (
          <path key={i} className="lp-route" d={r.d}
            style={{ animationDelay: r.delay, animationDuration: r.dur }} />
        ))}

        {/* ── City markers ── */}
        {CITIES.map(([cx, cy, label], i) => (
          <g key={i}>
            {/* Outer pulse ring */}
            <circle cx={cx} cy={cy} r="3" fill="none"
              stroke="rgba(245,158,11,0.35)" strokeWidth="1"
              className="lp-city-ring"
              style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2.5s' }} />
            {/* Core dot */}
            <circle cx={cx} cy={cy} r="2.5"
              fill="#f59e0b" fillOpacity="0.9"
              filter="url(#cityGlow)" />
          </g>
        ))}

        <defs>
          <filter id="cityGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>

      {/* Plane emoji icons along routes */}
      {ROUTES.map((r, i) => (
        <span key={i} className="lp-plane" style={{
          offsetPath: `path("${r.d}")`,
          animationDelay: r.delay,
          animationDuration: r.dur,
        }}>✈</span>
      ))}

      {/* ── Branding ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="lp-brand-badge">
          <span>✈</span> Professional Travel Platform
        </div>
        <h1 className="lp-brand-name">TravelDesk</h1>
        <p className="lp-brand-tagline">
          Manage flights, packages &amp; bookings<br />from one powerful dashboard.
        </p>

        <div className="lp-stats">
          <div>
            <div className="lp-stat-num">500+</div>
            <div className="lp-stat-label">Routes</div>
          </div>
          <div className="lp-stat-divider" />
          <div>
            <div className="lp-stat-num">50+</div>
            <div className="lp-stat-label">Airlines</div>
          </div>
          <div className="lp-stat-divider" />
          <div>
            <div className="lp-stat-num">24/7</div>
            <div className="lp-stat-label">Support</div>
          </div>
        </div>
      </div>

      {/* ── Feature list (bottom) ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="lp-features">
          {[
            'Flight search & seat management',
            'Umrah & Hajj package booking',
            'Multi-level agent hierarchy',
            'Real-time ledger & invoicing',
          ].map((f, i) => (
            <div key={i} className="lp-feature">
              <div className="lp-feature-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
