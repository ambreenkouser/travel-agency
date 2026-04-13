import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ErrorMessage from '../components/ui/ErrorMessage'

// Deterministic star positions based on index
const STARS = Array.from({ length: 22 }, (_, i) => ({
  top:      `${((i * 17 + 11) % 90) + 2}%`,
  left:     `${((i * 13 + 7)  % 95) + 1}%`,
  size:     i % 4 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px',
  delay:    `${((i * 0.73) % 4).toFixed(1)}s`,
  duration: `${(2.5 + (i % 3) * 0.8).toFixed(1)}s`,
}))

const CLOUDS = [
  { top: '12%', width: '220px', height: '55px', duration: '38s', delay: '0s',   blur: '18px', radius: '50% 60% 50% 40%' },
  { top: '28%', width: '160px', height: '40px', duration: '52s', delay: '12s',  blur: '14px', radius: '40% 50% 60% 50%' },
  { top: '55%', width: '280px', height: '65px', duration: '44s', delay: '6s',   blur: '22px', radius: '60% 40% 50% 55%' },
  { top: '74%', width: '140px', height: '35px', duration: '60s', delay: '22s',  blur: '12px', radius: '50% 55% 40% 60%' },
]

// SVG airplane path (simple silhouette)
const PlaneSVG = ({ color = 'white', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block' }}>
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </svg>
)

const PLANES = [
  { top: '18%', duration: '14s', delay: '0s',  dir: 'ltr', size: 26 },
  { top: '42%', duration: '20s', delay: '7s',  dir: 'rtl', size: 22 },
  { top: '63%', duration: '17s', delay: '13s', dir: 'ltr', size: 30 },
  { top: '30%', duration: '24s', delay: '19s', dir: 'rtl', size: 20 },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/flights', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        /* ── Background ── */
        @keyframes skyPulse {
          0%   { background-position: 0% 0%;     }
          25%  { background-position: 100% 0%;   }
          50%  { background-position: 100% 100%; }
          75%  { background-position: 0% 100%;   }
          100% { background-position: 0% 0%;     }
        }
        .sky-bg {
          background: linear-gradient(135deg,
            #020617 0%,
            #0c1445 20%,
            #0d2257 40%,
            #1a1a6e 60%,
            #0f2559 80%,
            #060d2e 100%
          );
          background-size: 400% 400%;
          animation: skyPulse 18s ease infinite;
        }

        /* ── Stars ── */
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1);   }
          50%      { opacity: 1;    transform: scale(1.8); }
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: white;
          animation: twinkle ease-in-out infinite;
          pointer-events: none;
        }

        /* ── Clouds ── */
        @keyframes cloudDrift {
          0%   { transform: translateX(-300px); opacity: 0;   }
          8%   { opacity: 0.55; }
          92%  { opacity: 0.55; }
          100% { transform: translateX(calc(100vw + 300px)); opacity: 0; }
        }
        .cloud {
          position: absolute;
          background: rgba(255,255,255,0.18);
          animation: cloudDrift linear infinite;
          pointer-events: none;
        }

        /* ── Planes ── */
        @keyframes flyLTR {
          0%   { transform: translateX(-80px) rotate(15deg);  opacity: 0; }
          6%   { opacity: 1; }
          94%  { opacity: 1; }
          100% { transform: translateX(calc(100vw + 80px)) rotate(15deg); opacity: 0; }
        }
        @keyframes flyRTL {
          0%   { transform: translateX(calc(100vw + 80px)) rotate(180deg) rotateX(0deg) scaleY(-1);  opacity: 0; }
          6%   { opacity: 1; }
          94%  { opacity: 1; }
          100% { transform: translateX(-80px) rotate(180deg) rotateX(0deg) scaleY(-1); opacity: 0; }
        }
        .plane-wrap {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0;
          pointer-events: none;
          filter: drop-shadow(0 0 6px rgba(147,197,253,0.7));
        }
        .plane-ltr { animation: flyLTR linear infinite; }
        .plane-rtl { animation: flyRTL linear infinite; }

        /* Trail behind the plane */
        .trail-ltr {
          width: 60px;
          height: 2px;
          background: linear-gradient(to left, rgba(147,197,253,0.6), transparent);
          margin-right: -2px;
          border-radius: 2px;
        }
        .trail-rtl {
          width: 60px;
          height: 2px;
          background: linear-gradient(to right, rgba(147,197,253,0.6), transparent);
          margin-left: -2px;
          border-radius: 2px;
        }

        /* ── Card shine ── */
        @keyframes cardShine {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%)  skewX(-15deg); }
        }
        .card-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: cardShine 4s ease-in-out infinite 2s;
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <div className="sky-bg min-h-screen flex items-center justify-center relative overflow-hidden">

        {/* ── Star field ── */}
        {STARS.map((s, i) => (
          <span key={i} className="star" style={{
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            animationDelay: s.delay, animationDuration: s.duration,
          }} />
        ))}

        {/* ── Clouds ── */}
        {CLOUDS.map((c, i) => (
          <div key={i} className="cloud" style={{
            top: c.top,
            width: c.width, height: c.height,
            borderRadius: c.radius,
            filter: `blur(${c.blur})`,
            animationDuration: c.duration, animationDelay: c.delay,
          }} />
        ))}

        {/* ── Planes with trails ── */}
        {PLANES.map((p, i) => (
          <div key={i}
            className={`plane-wrap ${p.dir === 'ltr' ? 'plane-ltr' : 'plane-rtl'}`}
            style={{ top: p.top, animationDuration: p.duration, animationDelay: p.delay }}
          >
            {p.dir === 'rtl' && <div className="trail-rtl" />}
            <PlaneSVG size={p.size} color="rgba(147,197,253,0.9)" />
            {p.dir === 'ltr' && <div className="trail-ltr" />}
          </div>
        ))}

        {/* ── Login card ── */}
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="rounded-2xl shadow-2xl overflow-hidden card-shine relative"
               style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,179,237,0.15)' }}>

            {/* Blue accent header */}
            <div style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #0ea5e9)',
              padding: '28px 32px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>✈</div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                    TravelDesk
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', marginTop: 1 }}>
                    Your travel management portal
                  </div>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="bg-white p-8">
              <p className="text-sm font-medium text-gray-700 mb-6">Sign in to your account</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  id="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <ErrorMessage message={error} />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-blue-200/50 mt-4">
            Powered by TravelDesk Platform
          </p>
        </div>
      </div>
    </>
  )
}
