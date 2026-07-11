import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../api/auth'
import BrandPanel from './BrandPanel'
import './authPanel.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [done,            setDone]            = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
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

          <h2 className="lp-form-title">Set a new password</h2>
          <p className="lp-form-sub">Choose a new password for your account.</p>

          {!token ? (
            <div className="lp-error">
              This reset link is missing its token. Please request a new one from the{' '}
              <Link to="/forgot-password">forgot password</Link> page.
            </div>
          ) : done ? (
            <div
              className="lp-error"
              style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
            >
              Your password has been reset. You can now{' '}
              <Link to="/login">sign in</Link> with your new password.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="lp-label">New Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">🔒</span>
                <input
                  type="password" autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="lp-input"
                />
              </div>

              <label className="lp-label">Confirm New Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">🔒</span>
                <input
                  type="password" autoComplete="new-password" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" className="lp-input"
                />
              </div>

              {error && (
                <div className="lp-error">
                  {error}
                  {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                    <>
                      {' '}
                      <Link to="/forgot-password">Request a new link</Link>.
                    </>
                  ) : null}
                </div>
              )}

              <button type="submit" disabled={loading} className="lp-btn">
                {loading ? 'Saving…' : 'Reset Password'}
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
