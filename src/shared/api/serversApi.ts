import { apiRequest } from './http'
import type {
  ServerListItemResponse,
  ServerResponse,
  UpsertServerRequest,
} from './types'

export const serversApi = {
  list(token: string) {
    return apiRequest<ServerListItemResponse[]>('/api/servers', { token })
  },
  get(token: string, serverId: number) {
    return apiRequest<ServerResponse>(`/api/servers/${serverId}`, { token })
  },
  create(token: string, body: UpsertServerRequest) {
    return apiRequest<ServerResponse>('/api/servers', {
      method: 'POST',
      token,
      body,
    })
  },
  update(token: string, serverId: number, body: UpsertServerRequest) {
    return apiRequest<ServerResponse>(`/api/servers/${serverId}`, {
      method: 'PUT',
      token,
      body,
    })
  },
  remove(token: string, serverId: number) {
    return apiRequest<void>(`/api/servers/${serverId}`, {
      method: 'DELETE',
      token,
    })
  },
}
