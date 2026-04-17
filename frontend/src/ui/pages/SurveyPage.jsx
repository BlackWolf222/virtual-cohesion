import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../../api'
import { useAuth } from '../../state/AuthContext'
import { AppShell } from '../components/AppShell'

export function SurveyPage() {
  const [favoriteGame, setFavoriteGame] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [activityPattern, setActivityPattern] = useState('FLEXIBLE')
  const [nativeLanguage, setNativeLanguage] = useState('Hungarian')
  const [extraLanguages, setExtraLanguages] = useState('')
  const [communicationStyle, setCommunicationStyle] = useState('LISTENER')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()
  const { setUser, user } = useAuth()

  async function submitSurvey(event) {
    event.preventDefault()
    const payload = {
      favorite_game: favoriteGame,
      activity_pattern: activityPattern,
      communication_style: communicationStyle,
      native_language: nativeLanguage,
      extra_languages: extraLanguages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      hobbies: hobbies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }
    try {
      await api.post('/surveys/me/', payload)
      setUser({ ...user, survey_completed: true })
      setStatus('Survey saved.')
      navigate('/calendar')
    } catch {
      setStatus('Could not save survey.')
    }
  }

  return (
    <AppShell title="Mandatory survey">
      <form className="card form-grid" onSubmit={submitSurvey}>
        <input value={favoriteGame} onChange={(e) => setFavoriteGame(e.target.value)} placeholder="Milyen játékot szeret" />
        <input value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="Hobbi/Érdeklodés (comma separated)" />
        <select value={activityPattern} onChange={(e) => setActivityPattern(e.target.value)}>
          <option value="MORNING">Morning</option>
          <option value="AFTERNOON">Afternoon</option>
          <option value="EVENING">Evening</option>
          <option value="FLEXIBLE">Flexible</option>
        </select>
        <input value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)} placeholder="Anyanyelv" />
        <input
          value={extraLanguages}
          onChange={(e) => setExtraLanguages(e.target.value)}
          placeholder="Extra languages (comma separated)"
        />
        <select value={communicationStyle} onChange={(e) => setCommunicationStyle(e.target.value)}>
          <option value="LISTENER">Inkább hallgatsz</option>
          <option value="TALKER">Inkább beszélgetsz</option>
          <option value="PASSIVE">Passzív</option>
        </select>
        <button className="btn" type="submit">
          Save survey
        </button>
        {status && <p className="muted">{status}</p>}
      </form>
    </AppShell>
  )
}
