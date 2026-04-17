import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../state/AuthContext'
import { RegisterPage } from './RegisterPage'

function renderWithRoute(route) {
  localStorage.clear()
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:token" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('RegisterPage', () => {
  it('prefills and locks invite token from link and hides back to login', () => {
    const token = '11111111-1111-1111-1111-111111111111'
    renderWithRoute(`/register/${token}`)

    const tokenInput = screen.getByPlaceholderText('Invite token')
    expect(tokenInput.value).toBe(token)
    expect(tokenInput.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByText('Back to login')).toBeNull()
  })

  it('shows back to login for non-link registration', () => {
    renderWithRoute('/register')
    expect(screen.getByText('Back to login')).toBeTruthy()
  })
})
