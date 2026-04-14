import { useEffect, useState } from 'react'

import { api } from '../../api'
import { AppShell } from '../components/AppShell'

export function HRDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api
      .get('/analytics/summary/')
      .then((res) => setSummary(res.data))
      .catch(() => setMessage('HR analytics are available only for HR head users.'))
  }, [])

  async function runMatching() {
    await api.post('/matching/run/')
    setMessage('Matching run completed.')
  }

  return (
    <AppShell title="HR analytics">
      <div className="card">
        <button className="btn" onClick={runMatching}>
          Run matching engine
        </button>
        {message && <p className="muted">{message}</p>}
      </div>
      {summary ? (
        <div className="grid-two">
          <section className="card">
            <h2>Participation</h2>
            <p>Employees: {summary.employee_count}</p>
            <p>Consent rate: {summary.consent_rate.toFixed(1)}%</p>
            <p>Survey completion: {summary.survey_completion_rate.toFixed(1)}%</p>
          </section>
          <section className="card">
            <h2>Matching</h2>
            <p>Total matches: {summary.total_matches}</p>
            <p>Cross-department: {summary.cross_department_matches}</p>
            <h3>Top hobbies</h3>
            {(summary.top_hobbies || []).map((hobby) => (
              <p key={hobby.hobbies__name}>
                {hobby.hobbies__name}: {hobby.total}
              </p>
            ))}
          </section>
        </div>
      ) : null}
    </AppShell>
  )
}
