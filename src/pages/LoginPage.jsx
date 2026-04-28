import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .lp-root {
          display: flex;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Left visual panel ── */
        .lp-left {
          flex: 0 0 58%;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #060c1a 0%, #0a1528 35%, #0e1f40 65%, #071530 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }

        /* Radial glow overlay */
        .lp-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
        }

        /* ── Map grid lines ── */
        .lp-map-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0.9;
        }

        /* Continent fills */
        .lp-continent { fill: rgba(30,64,175,0.18); stroke: rgba(59,130,246,0.35); stroke-width: 1; }

        /* Grid lines */
        .lp-grid { stroke: rgba(59,130,246,0.08); stroke-width: 0.7; fill: none; }

        /* Flight arcs */
        @keyframes drawRoute {
          0%   { stroke-dashoffset: 400; opacity: 0; }
          8%   { opacity: 0.8; }
          60%  { stroke-dashoffset: 0;   opacity: 0.8; }
          80%  { stroke-dashoffset: 0;   opacity: 0.3; }
          100% { stroke-dashoffset: 400; opacity: 0; }
        }
        .lp-route {
          fill: none;
          stroke: #f59e0b;
          stroke-width: 1.4;
          stroke-linecap: round;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawRoute ease-in-out infinite;
        }

        /* City pulse */
        @keyframes cityPulse {
          0%,100% { r: 3;   opacity: 0.9; }
          50%     { r: 5.5; opacity: 0.5; }
        }
        .lp-city-ring { animation: cityPulse ease-in-out infinite; }

        /* Plane icon along route */
        @keyframes flyRoute {
          0%   { offset-distance: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        .lp-plane {
          position: absolute;
          font-size: 13px;
          color: #fbbf24;
          pointer-events: none;
          animation: flyRoute ease-in-out infinite;
          offset-rotate: auto;
          filter: drop-shadow(0 0 4px rgba(251,191,36,0.8));
        }

        /* Brand text */
        .lp-brand-name {
          font-size: 2.6rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          line-height: 1;
          margin: 0;
        }
        .lp-brand-tagline {
          font-size: 1rem;
          color: rgba(148,163,184,0.85);
          margin: 8px 0 0;
          font-weight: 400;
          letter-spacing: 0.01em;
        }
        .lp-brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.28);
          border-radius: 20px;
          color: #f59e0b;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        /* Stats row */
        .lp-stats {
          display: flex;
          gap: 32px;
          margin-top: 32px;
        }
        .lp-stat-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
        }
        .lp-stat-label {
          font-size: 0.7rem;
          color: rgba(148,163,184,0.7);
          margin-top: 3px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .lp-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.1);
          align-self: stretch;
        }

        /* Features list */
        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 28px;
        }
        .lp-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(203,213,225,0.8);
          font-size: 0.875rem;
        }
        .lp-feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          flex-shrink: 0;
        }

        /* ── Right form panel ── */
        .lp-right {
          flex: 1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          position: relative;
        }
        .lp-right::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(30,64,175,0.15) 30%, rgba(30,64,175,0.15) 70%, transparent);
        }

        /* Form card */
        .lp-form-card {
          width: 100%;
          max-width: 380px;
        }

        /* Form header */
        .lp-form-logo {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 6px 20px rgba(29,78,216,0.35);
        }
        .lp-form-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
        }
        .lp-form-sub {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 28px;
        }

        /* Inputs */
        .lp-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .lp-input-wrap { position: relative; margin-bottom: 18px; }
        .lp-input {
          width: 100%;
          padding: 11px 14px 11px 42px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .lp-input::placeholder { color: #94a3b8; }
        .lp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }
        .lp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          font-size: 15px;
          opacity: 0.4;
        }
        .lp-input-icon-r {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 13px;
          opacity: 0.35;
          background: none;
          border: none;
          padding: 0;
        }

        /* Submit */
        .lp-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(29,78,216,0.4);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .lp-btn:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(29,78,216,0.5);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

        /* Error */
        .lp-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
          color: #dc2626;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        /* Footer links */
        .lp-footer {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .lp-footer-text {
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
          letter-spacing: 0.03em;
        }

        /* Responsive — collapse on small screens */
        @media (max-width: 768px) {
          .lp-left { display: none; }
          .lp-right { background: linear-gradient(160deg, #0e1f40, #1e3a5f); }
          .lp-right::before { display: none; }
          .lp-form-card { max-width: 100%; }
          .lp-form-title { color: #fff; }
          .lp-form-sub   { color: rgba(255,255,255,0.6); }
          .lp-label       { color: rgba(255,255,255,0.7); }
          .lp-input { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #fff; }
          .lp-input::placeholder { color: rgba(255,255,255,0.3); }
          .lp-input:focus { border-color: #60a5fa; background: rgba(255,255,255,0.1); }
          .lp-divider-line { background: rgba(255,255,255,0.1); }
          .lp-footer-text  { color: rgba(255,255,255,0.3); }
        }
      `}</style>

      <div className="lp-root">

        {/* ════════════════════════════════════
            LEFT — animated world map panel
        ════════════════════════════════════ */}
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

        {/* ════════════════════════════════════
            RIGHT — login form
        ════════════════════════════════════ */}
        <div className="lp-right">
          <div className="lp-form-card">

            {/* Logo */}
            <div className="lp-form-logo">
              <span style={{ fontSize: 22, color: 'white' }}>✈</span>
            </div>

            <h2 className="lp-form-title">Welcome back</h2>
            <p className="lp-form-sub">Sign in to your TravelDesk account</p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">✉</span>
                <input
                  type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@agency.com" className="lp-input"
                />
              </div>

              {/* Password */}
              <label className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">🔒</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="lp-input"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" className="lp-input-icon-r" onClick={() => setShowPw(p => !p)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>

              {error && <div className="lp-error">{error}</div>}

              <button type="submit" disabled={loading} className="lp-btn">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="lp-footer">
              <div className="lp-divider-line" />
              <span className="lp-footer-text">POWERED BY TRAVELDESK</span>
              <div className="lp-divider-line" />
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
