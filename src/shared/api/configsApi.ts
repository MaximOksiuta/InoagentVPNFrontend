import { apiRequest } from './http'
import type { AdminDeviceConfigResponse } from './types'

export const configsApi = {
  list(token: string) {
    return apiRequest<AdminDeviceConfigResponse[]>('/api/configs', { token })
  },
  remove(token: string, configId: number) {
    return apiRequest<void>(`/api/configs/${configId}`, {
      method: 'DELETE',
      token,
    })
  },
}
