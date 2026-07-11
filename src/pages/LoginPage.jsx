import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandPanel from './auth/BrandPanel'
import './auth/authPanel.css'

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
    <div className="lp-root">

      {/* ════════════════════════════════════
          LEFT — animated world map panel
      ════════════════════════════════════ */}
      <BrandPanel />

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

            <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 18 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none' }}>
                Forgot password?
              </Link>
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
  )
}
