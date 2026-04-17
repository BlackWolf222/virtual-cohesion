import { useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../../api'
import { AppShell } from '../components/AppShell'

const START_HOUR = 7
const END_HOUR = 20
const HOUR_HEIGHT = 62
const DAY_LABELS = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo']
const CREATE_FORM_INITIAL_STATE = {
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  video_url: '',
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function startOfWeek(date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return addDays(normalized, -normalized.getDay())
}

function toHourFraction(date) {
  return date.getHours() + date.getMinutes() / 60
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' }).format(date)
}

function formatTimeRange(start, end) {
  const formatter = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit' })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function normalizeDateInput(value) {
  if (!value || typeof value !== 'string') {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function parseIcsDateToken(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  if (/^\d{8}T\d{6}Z$/.test(token)) {
    const year = Number(token.slice(0, 4))
    const month = Number(token.slice(4, 6)) - 1
    const day = Number(token.slice(6, 8))
    const hour = Number(token.slice(9, 11))
    const minute = Number(token.slice(11, 13))
    const second = Number(token.slice(13, 15))
    return new Date(Date.UTC(year, month, day, hour, minute, second)).toISOString()
  }

  if (/^\d{8}T\d{6}$/.test(token)) {
    const year = Number(token.slice(0, 4))
    const month = Number(token.slice(4, 6)) - 1
    const day = Number(token.slice(6, 8))
    const hour = Number(token.slice(9, 11))
    const minute = Number(token.slice(11, 13))
    const second = Number(token.slice(13, 15))
    return new Date(year, month, day, hour, minute, second).toISOString()
  }

  if (/^\d{8}$/.test(token)) {
    const year = Number(token.slice(0, 4))
    const month = Number(token.slice(4, 6)) - 1
    const day = Number(token.slice(6, 8))
    return new Date(year, month, day, 9, 0, 0).toISOString()
  }

  return normalizeDateInput(token)
}

function normalizeImportedEvent(rawEvent) {
  const title = String(rawEvent?.title || rawEvent?.summary || rawEvent?.name || '').trim()
  const startsAt = parseIcsDateToken(String(rawEvent?.starts_at || rawEvent?.start || rawEvent?.dtstart || '').trim())
  let endsAt = parseIcsDateToken(String(rawEvent?.ends_at || rawEvent?.end || rawEvent?.dtend || '').trim())

  if (!title || !startsAt) {
    return null
  }

  if (!endsAt || new Date(endsAt) <= new Date(startsAt)) {
    endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString()
  }

  return {
    title,
    description: String(rawEvent?.description || '').trim(),
    starts_at: startsAt,
    ends_at: endsAt,
    video_url: String(rawEvent?.video_url || rawEvent?.url || '').trim(),
  }
}

function parseImportedEventsFromJson(rawText) {
  const parsed = JSON.parse(rawText)
  const rawEvents = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.events) ? parsed.events : []
  return rawEvents.map((eventItem) => normalizeImportedEvent(eventItem)).filter(Boolean)
}

function unfoldIcsLines(rawText) {
  const sourceLines = rawText.replace(/\r\n/g, '\n').split('\n')
  const unfolded = []
  for (const sourceLine of sourceLines) {
    if (!sourceLine) {
      continue
    }
    if ((sourceLine.startsWith(' ') || sourceLine.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += sourceLine.slice(1)
      continue
    }
    unfolded.push(sourceLine)
  }
  return unfolded
}

function parseImportedEventsFromIcs(rawText) {
  const lines = unfoldIcsLines(rawText)
  const importedEvents = []
  let currentEvent = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {}
      continue
    }
    if (line === 'END:VEVENT') {
      const normalized = normalizeImportedEvent(currentEvent)
      if (normalized) {
        importedEvents.push(normalized)
      }
      currentEvent = null
      continue
    }
    if (!currentEvent) {
      continue
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex < 0) {
      continue
    }

    const rawKey = line.slice(0, separatorIndex).toUpperCase()
    const key = rawKey.split(';')[0]
    const value = line.slice(separatorIndex + 1).trim()

    if (key === 'SUMMARY') {
      currentEvent.title = value
    }
    if (key === 'DESCRIPTION') {
      currentEvent.description = value.replace(/\\n/g, '\n')
    }
    if (key === 'DTSTART') {
      currentEvent.starts_at = parseIcsDateToken(value)
    }
    if (key === 'DTEND') {
      currentEvent.ends_at = parseIcsDateToken(value)
    }
    if (key === 'URL') {
      currentEvent.video_url = value
    }
  }

  return importedEvents
}

function parseImportedEvents(fileName, rawText) {
  const lowerFileName = String(fileName || '').toLowerCase()

  if (lowerFileName.endsWith('.json')) {
    return parseImportedEventsFromJson(rawText)
  }
  if (lowerFileName.endsWith('.ics')) {
    return parseImportedEventsFromIcs(rawText)
  }

  try {
    return parseImportedEventsFromJson(rawText)
  } catch {
    return parseImportedEventsFromIcs(rawText)
  }
}

function getMiniCalendarCells(anchorDate) {
  const year = anchorDate.getFullYear()
  const month = anchorDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()

  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    const day = daysInPreviousMonth - startOffset + i + 1
    cells.push({
      day,
      inMonth: false,
      date: new Date(year, month - 1, day),
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      inMonth: true,
      date: new Date(year, month, day),
    })
  }

  while (cells.length < 42) {
    const day = cells.length - (startOffset + daysInMonth) + 1
    cells.push({
      day,
      inMonth: false,
      date: new Date(year, month + 1, day),
    })
  }

  return cells
}

function getEventBlockStyle(calendarEntry) {
  const startsAt = new Date(calendarEntry.starts_at)
  const endsAt = new Date(calendarEntry.ends_at)
  const startsAtHour = toHourFraction(startsAt)
  const endsAtHour = toHourFraction(endsAt)

  if (endsAtHour <= START_HOUR || startsAtHour >= END_HOUR) {
    return null
  }

  const clampedStart = Math.max(startsAtHour, START_HOUR)
  const clampedEnd = Math.min(Math.max(endsAtHour, clampedStart + 0.25), END_HOUR)
  return {
    top: `${(clampedStart - START_HOUR) * HOUR_HEIGHT}px`,
    height: `${Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 24)}px`,
  }
}

export function CalendarPage() {
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [meetings, setMeetings] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [eventForm, setEventForm] = useState(CREATE_FORM_INITIAL_STATE)
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const importInputRef = useRef(null)

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT
  const hourLabels = useMemo(() => {
    const labels = []
    for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) {
      labels.push(hour)
    }
    return labels
  }, [])

  useEffect(() => {
    async function loadCalendarData() {
      setIsLoading(true)
      setError('')
      try {
        const [meetingResponse, eventResponse] = await Promise.all([
          api.get('/meetings/'),
          api.get('/meetings/calendar-events/'),
        ])
        setMeetings(Array.isArray(meetingResponse.data) ? meetingResponse.data : [])
        setCalendarEvents(Array.isArray(eventResponse.data) ? eventResponse.data : [])
      } catch {
        setError('A naptár eseményeket most nem sikerült betölteni.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCalendarData().catch(() => {})
  }, [])

  function updateEventForm(key, value) {
    setEventForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onCreateEvent(event) {
    event.preventDefault()
    setFormMessage('')
    setFormError('')

    const startsAt = normalizeDateInput(eventForm.starts_at)
    const endsAt = normalizeDateInput(eventForm.ends_at)
    if (!eventForm.title.trim()) {
      setFormError('Adj meg egy cimet az esemenyhez.')
      return
    }
    if (!startsAt || !endsAt) {
      setFormError('Adj meg ervenyes kezdest es befejezest.')
      return
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('A befejezes idopontjanak kesobbinek kell lennie.')
      return
    }

    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      video_url: eventForm.video_url.trim(),
    }

    setIsSavingEvent(true)
    try {
      const response = await api.post('/meetings/calendar-events/', payload)
      setCalendarEvents((prev) => [...prev, response.data])
      setAnchorDate(new Date(response.data.starts_at))
      setFormMessage('Esemeny sikeresen mentve.')
      setEventForm(CREATE_FORM_INITIAL_STATE)
      setIsCreatePanelOpen(false)
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail
      setFormError(detail ? String(detail) : 'Az esemeny mentese sikertelen.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  async function onImportFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setImportMessage('')
    setImportError('')
    setIsImporting(true)
    try {
      const rawText = await file.text()
      const parsedEvents = parseImportedEvents(file.name, rawText)
      if (!parsedEvents.length) {
        setImportError('A fajl nem tartalmaz importalhato esemenyt.')
        return
      }

      const response = await api.post('/meetings/calendar-events/import/', { events: parsedEvents })
      const importedItems = Array.isArray(response.data) ? response.data : []
      setCalendarEvents((prev) => [...prev, ...importedItems])
      if (importedItems.length > 0) {
        setAnchorDate(new Date(importedItems[0].starts_at))
      }
      setImportMessage(`${importedItems.length} esemeny importalva.`)
    } catch (importException) {
      const detail = importException?.response?.data?.detail
      setImportError(detail ? String(detail) : 'Import sikertelen. JSON vagy ICS fajlt hasznalj.')
    } finally {
      setIsImporting(false)
    }
  }

  const calendarEntries = useMemo(() => {
    const meetingEntries = meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      title: meeting.other_person,
      description: meeting.shared_hobby ? `Kozos hobbi: ${meeting.shared_hobby}` : '',
      starts_at: meeting.starts_at,
      ends_at: meeting.ends_at,
      video_url: meeting.video_url,
      entry_type: 'MEETING',
      source_label: 'Meeting',
    }))

    const customEntries = calendarEvents.map((calendarEvent) => ({
      id: `event-${calendarEvent.id}`,
      title: calendarEvent.title,
      description: calendarEvent.description || '',
      starts_at: calendarEvent.starts_at,
      ends_at: calendarEvent.ends_at,
      video_url: calendarEvent.video_url || '',
      entry_type: 'CALENDAR_EVENT',
      source_label: calendarEvent.source === 'IMPORTED' ? 'Import' : 'Sajat',
    }))

    return [...meetingEntries, ...customEntries].sort((left, right) => new Date(left.starts_at) - new Date(right.starts_at))
  }, [calendarEvents, meetings])

  const weekMeetings = useMemo(() => {
    const weekEnd = addDays(weekStart, 7)
    return calendarEntries.filter((calendarEntry) => {
      const startsAt = new Date(calendarEntry.starts_at)
      return startsAt >= weekStart && startsAt < weekEnd
    })
  }, [calendarEntries, weekStart])

  const meetingsByDay = useMemo(() => {
    const grouped = new Map(Array.from({ length: 7 }, (_, index) => [index, []]))
    for (const calendarEntry of weekMeetings) {
      const dayIndex = new Date(calendarEntry.starts_at).getDay()
      grouped.get(dayIndex)?.push(calendarEntry)
    }
    for (const dayMeetings of grouped.values()) {
      dayMeetings.sort((left, right) => new Date(left.starts_at) - new Date(right.starts_at))
    }
    return grouped
  }, [weekMeetings])

  const miniCalendarCells = useMemo(() => getMiniCalendarCells(anchorDate), [anchorDate])
  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'

  return (
    <AppShell title="Naptár">
      <section className="calendar-shell card">
        <header className="calendar-toolbar">
          <div className="calendar-toolbar-left">
            <button className="calendar-nav-btn" type="button" onClick={() => setAnchorDate(new Date())}>
              Ma
            </button>
            <button className="calendar-icon-btn" type="button" onClick={() => setAnchorDate((prev) => addDays(prev, -7))}>
              {'<'}
            </button>
            <button className="calendar-icon-btn" type="button" onClick={() => setAnchorDate((prev) => addDays(prev, 7))}>
              {'>'}
            </button>
            <h2 className="calendar-title">{formatMonthTitle(anchorDate)}</h2>
          </div>
          <div className="calendar-toolbar-right">
            <span className="calendar-timezone-label">Idozona</span>
            <strong className="calendar-timezone-value">{timezoneLabel}</strong>
          </div>
        </header>

        <div className="calendar-board">
          <aside className="calendar-side">
            <div className="calendar-actions">
              <button
                className="calendar-create-btn"
                type="button"
                onClick={() => {
                  setFormMessage('')
                  setFormError('')
                  setIsCreatePanelOpen((prev) => !prev)
                }}
              >
                {isCreatePanelOpen ? 'Form bezarasa' : '+ Letrehozas'}
              </button>
              <button
                className="calendar-import-btn"
                type="button"
                disabled={isImporting}
                onClick={() => importInputRef.current?.click()}
              >
                {isImporting ? 'Importalas...' : 'Import'}
              </button>
              <input
                ref={importInputRef}
                className="calendar-import-input"
                type="file"
                accept=".json,.ics,application/json,text/calendar"
                onChange={onImportFileChange}
              />
            </div>

            {isCreatePanelOpen ? (
              <form className="calendar-create-panel" onSubmit={onCreateEvent}>
                <label className="calendar-field-label" htmlFor="calendar-title-input">
                  Cim
                </label>
                <input
                  id="calendar-title-input"
                  value={eventForm.title}
                  onChange={(eventValue) => updateEventForm('title', eventValue.target.value)}
                  placeholder="Esemeny cime"
                  required
                />

                <label className="calendar-field-label" htmlFor="calendar-start-input">
                  Kezdes
                </label>
                <input
                  id="calendar-start-input"
                  type="datetime-local"
                  value={eventForm.starts_at}
                  onChange={(eventValue) => updateEventForm('starts_at', eventValue.target.value)}
                  required
                />

                <label className="calendar-field-label" htmlFor="calendar-end-input">
                  Befejezes
                </label>
                <input
                  id="calendar-end-input"
                  type="datetime-local"
                  value={eventForm.ends_at}
                  onChange={(eventValue) => updateEventForm('ends_at', eventValue.target.value)}
                  required
                />

                <label className="calendar-field-label" htmlFor="calendar-video-input">
                  Video link (opcionalis)
                </label>
                <input
                  id="calendar-video-input"
                  type="url"
                  value={eventForm.video_url}
                  onChange={(eventValue) => updateEventForm('video_url', eventValue.target.value)}
                  placeholder="https://"
                />

                <label className="calendar-field-label" htmlFor="calendar-description-input">
                  Megjegyzes
                </label>
                <textarea
                  id="calendar-description-input"
                  className="calendar-textarea"
                  rows={3}
                  value={eventForm.description}
                  onChange={(eventValue) => updateEventForm('description', eventValue.target.value)}
                  placeholder="Rovid leiras"
                />

                <div className="calendar-form-actions">
                  <button className="btn" type="submit" disabled={isSavingEvent}>
                    {isSavingEvent ? 'Mentes...' : 'Esemeny mentese'}
                  </button>
                </div>

                {formMessage ? <p className="calendar-form-note">{formMessage}</p> : null}
                {formError ? <p className="calendar-form-note is-error">{formError}</p> : null}
              </form>
            ) : null}

            {importMessage ? <p className="calendar-form-note">{importMessage}</p> : null}
            {importError ? <p className="calendar-form-note is-error">{importError}</p> : null}

            <div className="calendar-mini">
              <h3>{formatMonthTitle(anchorDate)}</h3>
              <div className="calendar-mini-weekdays">
                {DAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="calendar-mini-grid">
                {miniCalendarCells.map((cell) => {
                  const isToday = isSameDay(cell.date, new Date())
                  const inSelectedWeek = cell.date >= weekStart && cell.date < addDays(weekStart, 7)

                  return (
                    <button
                      key={cell.date.toISOString()}
                      className={`calendar-mini-day${cell.inMonth ? '' : ' is-outside'}${
                        isToday ? ' is-today' : ''
                      }${inSelectedWeek ? ' is-selected-week' : ''}`}
                      type="button"
                      onClick={() => setAnchorDate(cell.date)}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="calendar-upcoming card">
              <h3>Heti események</h3>
              {weekMeetings.length === 0 ? <p className="muted">Nincs esemény erre a hétre.</p> : null}
              {weekMeetings.slice(0, 6).map((calendarEntry) => {
                const startsAt = new Date(calendarEntry.starts_at)
                const endsAt = new Date(calendarEntry.ends_at)
                return (
                  <div key={calendarEntry.id} className="calendar-upcoming-item">
                    <p>{calendarEntry.title}</p>
                    <p className="muted">{`${formatTimeRange(startsAt, endsAt)} - ${calendarEntry.source_label}`}</p>
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="calendar-main">
            <div className="calendar-week-header">
              <div className="calendar-time-head">Ido</div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date())
                return (
                  <div key={day.toISOString()} className="calendar-day-head">
                    <span className="calendar-day-head-weekday">{DAY_LABELS[day.getDay()]}</span>
                    <span className={`calendar-day-head-date${isToday ? ' is-today' : ''}`}>{day.getDate()}</span>
                  </div>
                )
              })}
            </div>

            <div className="calendar-grid-wrap">
              <div className="calendar-time-col" style={{ height: `${gridHeight}px` }}>
                {hourLabels.map((hour) => (
                  <span
                    key={hour}
                    className="calendar-time-label"
                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                  >
                    {`${hour}:00`}
                  </span>
                ))}
              </div>

              <div className="calendar-days" style={{ height: `${gridHeight}px` }}>
                {weekDays.map((day, dayIndex) => (
                  <div key={day.toISOString()} className="calendar-day-col">
                    {(meetingsByDay.get(dayIndex) || []).map((calendarEntry) => {
                      const startsAt = new Date(calendarEntry.starts_at)
                      const endsAt = new Date(calendarEntry.ends_at)
                      const style = getEventBlockStyle(calendarEntry)
                      if (!style) return null

                      const eventClassName = `calendar-event${
                        calendarEntry.entry_type === 'CALENDAR_EVENT' ? ' is-custom' : ' is-meeting'
                      }${calendarEntry.video_url ? '' : ' is-no-link'}`

                      const content = (
                        <>
                          <strong>{calendarEntry.title}</strong>
                          <span>{formatTimeRange(startsAt, endsAt)}</span>
                          {calendarEntry.description ? <small>{calendarEntry.description}</small> : null}
                        </>
                      )

                      if (!calendarEntry.video_url) {
                        return (
                          <div key={calendarEntry.id} className={eventClassName} style={style}>
                            {content}
                          </div>
                        )
                      }

                      return (
                        <a
                          key={calendarEntry.id}
                          className={eventClassName}
                          style={style}
                          href={calendarEntry.video_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content}
                        </a>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? <p className="calendar-status muted">Naptár betöltése...</p> : null}
        {error ? <p className="calendar-status error">{error}</p> : null}
      </section>
    </AppShell>
  )
}
