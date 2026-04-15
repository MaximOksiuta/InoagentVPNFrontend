import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { authApi } from '../../shared/api/authApi'
import type {
  AuthTokenResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
} from '../../shared/api/types'
import { clearStoredToken, getStoredToken, setStoredToken } from '../../shared/lib/storage'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      if (!token) {
        if (isMounted) setIsReady(true)
        return
      }

      try {
        const me = await authApi.getMe(token)
        if (isMounted) {
          setUser(me)
        }
      } catch {
        clearStoredToken()
        if (isMounted) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) setIsReady(true)
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [token])

  async function handleAuth(tokenResponse: AuthTokenResponse) {
    setStoredToken(tokenResponse.accessToken)
    setToken(tokenResponse.accessToken)
    const me = await authApi.getMe(tokenResponse.accessToken)
    setUser(me)
  }

  async function login(payload: LoginRequest) {
    const response = await authApi.login(payload)
    await handleAuth(response)
  }

  async function register(payload: RegisterRequest) {
    await authApi.register(payload)
  }

  function logout() {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    if (!token) return
    const me = await authApi.getMe(token)
    setUser(me)
  }

  const value = {
    token,
    user,
    isReady,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
