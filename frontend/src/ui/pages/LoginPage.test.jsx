import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '../../state/AuthContext'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('renders login heading', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>,
    )
    expect(screen.getByText('Welcome back')).toBeTruthy()
  })
})
