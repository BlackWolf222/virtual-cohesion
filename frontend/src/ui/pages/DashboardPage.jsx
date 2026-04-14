import { useEffect, useState } from 'react'

import { api } from '../../api'
import { AppShell } from '../components/AppShell'

export function DashboardPage() {
  const [meetings, setMeetings] = useState([])
  const [matches, setMatches] = useState([])
  const [slot, setSlot] = useState({ starts_at: '', ends_at: '' })

  async function loadData() {
    const [meetingRes, matchRes] = await Promise.all([api.get('/meetings/'), api.get('/matching/list/')])
    setMeetings(meetingRes.data)
    setMatches(matchRes.data)
  }

  useEffect(() => {
    loadData().catch(() => {})
  }, [])

  async function addSlot(event) {
    event.preventDefault()
    await api.post('/matching/availability/', slot)
    setSlot({ starts_at: '', ends_at: '' })
  }

  return (
    <AppShell title="Employee dashboard">
      <div className="card">
        <h2>Add your free slot</h2>
        <form className="inline-form" onSubmit={addSlot}>
          <input
            type="datetime-local"
            value={slot.starts_at}
            onChange={(e) => setSlot((prev) => ({ ...prev, starts_at: e.target.value }))}
            required
          />
          <input
            type="datetime-local"
            value={slot.ends_at}
            onChange={(e) => setSlot((prev) => ({ ...prev, ends_at: e.target.value }))}
            required
          />
          <button className="btn" type="submit">
            Save slot
          </button>
        </form>
      </div>

      <div className="grid-two">
        <section className="card">
          <h2>Your matches</h2>
          {matches.length === 0 ? <p className="muted">No matches yet.</p> : null}
          {matches.map((match) => (
            <div key={match.id} className="list-item">
              <p>{match.user_one_name} ↔ {match.user_two_name}</p>
              <p className="muted">Shared hobby: {match.shared_hobby}</p>
            </div>
          ))}
        </section>

        <section className="card">
          <h2>Your meetings</h2>
          {meetings.length === 0 ? <p className="muted">No meetings yet.</p> : null}
          {meetings.map((meeting) => (
            <div key={meeting.id} className="list-item">
              <p>{meeting.other_person}</p>
              <p className="muted">{new Date(meeting.starts_at).toLocaleString()}</p>
              <a href={meeting.video_url} target="_blank" rel="noreferrer">
                Open video room
              </a>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  )
}
