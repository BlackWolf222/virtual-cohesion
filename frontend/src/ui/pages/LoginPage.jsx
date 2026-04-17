import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { api } from '../../api'
import { useAuth } from '../../state/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      const tokenRes = await api.post('/auth/login/', { username: email, password })
      const access = tokenRes.data.access
      api.defaults.headers.common.Authorization = `Bearer ${access}`
      const meRes = await api.get('/auth/me/')
      login(access, meRes.data)
      if (!meRes.data.survey_completed) {
        navigate('/survey')
        return
      }
      navigate('/calendar')
    } catch {
      setError('Invalid login details for this tenant.')
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="card auth-card" onSubmit={onSubmit}>
        <img src="/vc-logo.svg" alt="VC logo" width="54" height="54" />
        <h1>Welcome back</h1>
        <p className="muted">Sign in to Virtual Cohesion</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
        />
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">
          Login
        </button>
        <p className="muted small">
          No account yet? <Link to="/register">Register with invite</Link>
        </p>
      </form>
    </div>
  )
}
