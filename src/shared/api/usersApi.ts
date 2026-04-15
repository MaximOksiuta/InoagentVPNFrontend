import { apiRequest } from './http'
import type { AdminUserResponse } from './types'

export const usersApi = {
  list(token: string) {
    return apiRequest<AdminUserResponse[]>('/api/users', { token })
  },
  approve(token: string, userId: number) {
    return apiRequest<AdminUserResponse>(`/api/users/${userId}/approve`, {
      method: 'POST',
      token,
    })
  },
  ban(token: string, userId: number) {
    return apiRequest<AdminUserResponse>(`/api/users/${userId}/ban`, {
      method: 'POST',
      token,
    })
  },
}
