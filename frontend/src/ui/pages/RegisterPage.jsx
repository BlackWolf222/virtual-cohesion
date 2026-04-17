import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api } from '../../api'
import { useAuth } from '../../state/AuthContext'

const initialState = {
  invite_token: '',
  email: '',
  password: '',
  full_name: '',
  nickname: '',
  birth_date: '',
  gender: 'UNDISCLOSED',
  department: '',
  consent_aggregated_data: false,
}

export function RegisterPage() {
  const { token: inviteTokenFromUrl } = useParams()
  const isInviteLinkFlow = Boolean(inviteTokenFromUrl)
  const { login } = useAuth()
  const [form, setForm] = useState(() => ({
    ...initialState,
    invite_token: inviteTokenFromUrl || '',
  }))
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    setForm((prev) => ({ ...prev, invite_token: inviteTokenFromUrl || '' }))
  }, [inviteTokenFromUrl])

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    if (!form.consent_aggregated_data) {
      setError('A hozzájáruló pipa kötelezo.')
      return
    }
    try {
      await api.post('/auth/register/', form)

      const tokenRes = await api.post('/auth/login/', { username: form.email, password: form.password })
      const access = tokenRes.data.access
      api.defaults.headers.common.Authorization = `Bearer ${access}`
      const meRes = await api.get('/auth/me/')
      login(access, meRes.data)
      navigate('/survey')
    } catch (err) {
      const data = err.response?.data
      let detail = 'Registration failed. Use http://demo.localhost/register/[token] (tenant host), a valid unused invite UUID, and consent checked.'
      if (typeof data === 'string') {
        detail = data
      } else if (data?.detail) {
        detail = String(data.detail)
      } else if (data && typeof data === 'object') {
        const parts = []
        for (const [k, v] of Object.entries(data)) {
          const msg = Array.isArray(v) ? v.join(' ') : String(v)
          parts.push(`${k}: ${msg}`)
        }
        if (parts.length) detail = parts.join(' ')
      }
      setError(detail)
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="card auth-card" onSubmit={onSubmit}>
        <img src="/vc-logo.svg" alt="VC logo" width="54" height="54" />
        <h1>Employee registration</h1>
        {window.location.hostname === 'localhost' && (
          <p className="muted small">
            You are on plain <code>localhost</code>. Open{' '}
            <a href="http://demo.localhost/register">demo.localhost/register</a> instead so registration hits the
            correct company (tenant).
          </p>
        )}
        <input
          value={form.invite_token}
          onChange={(e) => updateField('invite_token', e.target.value)}
          placeholder="Invite token"
          readOnly={isInviteLinkFlow}
          disabled={isInviteLinkFlow}
          required
        />
        <input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Mail" required />
        <input
          value={form.full_name}
          onChange={(e) => updateField('full_name', e.target.value)}
          placeholder="Teljes Név"
          required
        />
        <input
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          placeholder="Jelszó"
          type="password"
          required
        />
        <input
          value={form.nickname}
          onChange={(e) => updateField('nickname', e.target.value)}
          placeholder="Nickname (Optional)"
        />
        <input
          value={form.birth_date}
          onChange={(e) => updateField('birth_date', e.target.value)}
          type="date"
          required
        />
        <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
          <option value="UNDISCLOSED">Nem</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          value={form.department}
          onChange={(e) => updateField('department', e.target.value)}
          placeholder="Department"
          required
        />
        <label className="checkbox-row">
          <input
            checked={form.consent_aggregated_data}
            onChange={(e) => updateField('consent_aggregated_data', e.target.checked)}
            type="checkbox"
          />
          Hozzájárulok, hogy a HR osztály lássa az aggregált adataimat.
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">
          Register
        </button>
        {!isInviteLinkFlow && (
          <p className="muted small">
            Already registered? <Link to="/login">Back to login</Link>
          </p>
        )}
      </form>
    </div>
  )
}
