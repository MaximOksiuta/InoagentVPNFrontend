export type RegisterRequest = {
  nickname: string
  phone: string
  password: string
}

export type RegisterResponse = {
  id: number
  nickname: string
  phone: string
  telegramId?: number | null
}

export type LoginRequest = {
  phone: string
  password: string
}

export type AuthTokenResponse = {
  accessToken: string
  expiresIn: number
  tokenType: string
}

export type CurrentUserResponse = {
  id: number
  isAdmin: boolean
  nickname: string
  phone: string
  telegramId?: number | null
}

export type DeviceResponse = {
  id: number
  name: string
}

export type CreateDeviceRequest = {
  name: string
}

export type UpdateDeviceRequest = {
  name: string
}

export type GenerateDeviceConfigRequest = {
  serverId: number
}

export type DeviceServerResponse = {
  config: string
  id: number
  serverId: number
  serverLocation: string
  serverName: string
}

export type DeviceDetailsResponse = {
  configs: DeviceServerResponse[]
  id: number
  name: string
}

export type ServerListItemResponse = {
  id: number
  location: string
  name: string
}

export type UpsertServerRequest = {
  containerConfigDir: string
  containerName: string
  host: string
  interfaceName: string
  location: string
  name: string
  password?: string | null
  port: number
  sshKeyPath?: string | null
  username: string
}

export type ServerResponse = UpsertServerRequest & {
  id: number
}
