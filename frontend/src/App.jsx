import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './state/AuthContext'
import { CalendarPage } from './ui/pages/CalendarPage'
import { DashboardPage } from './ui/pages/DashboardPage'
import { HRDashboardPage } from './ui/pages/HRDashboardPage'
import { InviteManagementPage } from './ui/pages/InviteManagementPage'
import { LoginPage } from './ui/pages/LoginPage'
import { RegisterPage } from './ui/pages/RegisterPage'
import { SurveyPage } from './ui/pages/SurveyPage'

function ProtectedRoute({ children, allowIncompleteSurvey = false }) {
  const { token, user, isAuthLoading } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (isAuthLoading) {
    return null
  }
  const hasIncompleteMandatorySurvey = user?.role === 'EMPLOYEE' && user?.survey_completed === false
  if (!allowIncompleteSurvey && hasIncompleteMandatorySurvey) {
    return <Navigate to="/survey" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/:token" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/survey"
        element={
          <ProtectedRoute allowIncompleteSurvey>
            <SurveyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <HRDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invites"
        element={
          <ProtectedRoute>
            <InviteManagementPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
  )
}
