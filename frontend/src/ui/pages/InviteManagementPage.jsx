import { useEffect, useState } from 'react'

import { api } from '../../api'
import { AppShell } from '../components/AppShell'

export function InviteManagementPage() {
  const [invites, setInvites] = useState([])
  const [emailHint, setEmailHint] = useState('')

  async function refreshInvites() {
    const res = await api.get('/auth/invites/')
    setInvites(res.data)
  }

  useEffect(() => {
    refreshInvites().catch(() => {})
  }, [])

  async function createInvite(event) {
    event.preventDefault()
    await api.post('/auth/invites/', { email_hint: emailHint, expires_in_days: 7 })
    setEmailHint('')
    await refreshInvites()
  }

  return (
    <AppShell title="Invite management">
      <div className="card">
        <form className="inline-form" onSubmit={createInvite}>
          <input
            value={emailHint}
            onChange={(e) => setEmailHint(e.target.value)}
            type="email"
            placeholder="Employee email hint (optional)"
          />
          <button className="btn" type="submit">
            Create invite
          </button>
        </form>
      </div>
      <section className="card">
        <h2>Active invites</h2>
        {invites.map((invite) => (
          <div key={invite.token} className="list-item">
            <p>Token: {invite.token}</p>
            <p className="muted">Email hint: {invite.email_hint || 'N/A'}</p>
            <p className="muted">Expires: {new Date(invite.expires_at).toLocaleString()}</p>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
