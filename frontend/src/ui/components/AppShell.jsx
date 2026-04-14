import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../state/AuthContext'

export function AppShell({ title, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="screen">
      <aside className="sidebar card">
        <div className="brand">
          <img src="/vc-logo.svg" alt="Virtual Cohesion logo" width="42" height="42" />
          <div>
            <p className="brand-name">Virtual Cohesion</p>
            <p className="brand-meta">{user?.role || 'Employee'}</p>
          </div>
        </div>
        <nav className="nav-col">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/survey">Survey</Link>
          <Link to="/invites">Invites</Link>
          <Link to="/hr">HR Analytics</Link>
        </nav>
        <button className="btn btn-secondary" onClick={onLogout}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <header className="content-header">
          <h1>{title}</h1>
        </header>
        {children}
      </main>
    </div>
  )
}
