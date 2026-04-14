import { apiRequest } from './http'
import type {
  AuthTokenResponse,
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from './types'

export const authApi = {
  register(payload: RegisterRequest) {
    return apiRequest<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })
  },
  login(payload: LoginRequest) {
    return apiRequest<AuthTokenResponse>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })
  },
  getMe(token: string) {
    return apiRequest<CurrentUserResponse>('/api/auth/me', {
      token,
    })
  },
}
