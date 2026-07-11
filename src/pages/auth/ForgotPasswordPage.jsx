import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/auth'
import BrandPanel from './BrandPanel'
import './authPanel.css'

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      // Always show the generic success state — the backend never signals
      // whether the email matched an account, and neither should the UI.
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <BrandPanel />

      <div className="lp-right">
        <div className="lp-form-card">

          <div className="lp-form-logo">
            <span style={{ fontSize: 22, color: 'white' }}>✈</span>
          </div>

          <h2 className="lp-form-title">Forgot your password?</h2>
          <p className="lp-form-sub">Enter your email and we'll send you a reset link.</p>

          {submitted ? (
            <div
              className="lp-error"
              style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
            >
              If that email exists in our system, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">✉</span>
                <input
                  type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@agency.com" className="lp-input"
                />
              </div>

              {error && <div className="lp-error">{error}</div>}

              <button type="submit" disabled={loading} className="lp-btn">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="lp-footer">
            <div className="lp-divider-line" />
            <Link to="/login" className="lp-footer-text" style={{ textDecoration: 'none' }}>
              BACK TO SIGN IN
            </Link>
            <div className="lp-divider-line" />
          </div>
        </div>
      </div>
    </div>
  )
}
