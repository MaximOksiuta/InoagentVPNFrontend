import { apiBinaryRequest, apiRequest } from './http'
import type {
  CreateDeviceRequest,
  DeviceDetailsResponse,
  DeviceResponse,
  DeviceServerResponse,
  GenerateDeviceConfigRequest,
  UpdateDeviceRequest,
} from './types'

export const devicesApi = {
  list(token: string) {
    return apiRequest<DeviceResponse[]>('/api/devices', { token })
  },
  get(token: string, deviceId: number) {
    return apiRequest<DeviceDetailsResponse>(`/api/devices/${deviceId}`, { token })
  },
  create(token: string, body: CreateDeviceRequest) {
    return apiRequest<DeviceResponse>('/api/devices', {
      method: 'POST',
      token,
      body,
    })
  },
  update(token: string, deviceId: number, body: UpdateDeviceRequest) {
    return apiRequest<DeviceDetailsResponse>(`/api/devices/${deviceId}`, {
      method: 'PUT',
      token,
      body,
    })
  },
  remove(token: string, deviceId: number) {
    return apiRequest<void>(`/api/devices/${deviceId}`, {
      method: 'DELETE',
      token,
    })
  },
  generateConfig(token: string, deviceId: number, body: GenerateDeviceConfigRequest) {
    return apiRequest<DeviceServerResponse>(`/api/devices/${deviceId}/configs/generate`, {
      method: 'POST',
      token,
      body,
    })
  },
  downloadConfigFile(token: string, deviceId: number, configId: number) {
    return apiBinaryRequest(`/api/devices/${deviceId}/configs/${configId}/file`, { token })
  },
  getConfigQr(token: string, deviceId: number, configId: number) {
    return apiBinaryRequest(`/api/devices/${deviceId}/configs/${configId}/qr`, { token })
  },
}
