import { createContext, useContext } from 'react'
import type {
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
} from '../../shared/api/types'

export type AuthContextValue = {
  token: string | null
  user: CurrentUserResponse | null
  isReady: boolean
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
