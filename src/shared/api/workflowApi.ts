import { apiBinaryRequest, apiRequest } from './http'

export type CatalogEntry = {id:number;deviceId:number;deviceName:string;serverId:number;serverName:string;serverLocation:string;archived:boolean;userId:number;userName:string;userPhone:string|null}
export type CatalogServer = {id:number;name:string;location:string;archived:boolean;configCount:number}
export type CatalogPage = {entries:CatalogEntry[];total:number;servers:CatalogServer[]}
export type JobItem = {deviceId:number;deviceName:string;userId:number;userName:string;state:string;configId:number|null;error:string|null}
export type GenerationJob = {id:string;serverId:number;serverName:string;createdAt:number;state:string;items:JobItem[]}
export type Notification = {id:number;serverId:number;serverName:string;location:string;createdAt:number;read:boolean;comment?:string|null}
export type BatchRequest = {serverId:number;deviceIds?:number[];allUsers?:boolean;userId?:number;requestKey:string}

export const workflowApi = {
  catalog: (token:string,params:URLSearchParams) => apiRequest<CatalogPage>(`/api/library?${params}`,{token}),
  text: (token:string,id:number) => apiRequest<{config:string}>(`/api/library/${id}/text`,{token}),
  file: (token:string,id:number) => apiBinaryRequest(`/api/library/${id}/file`,{token}),
  qr: (token:string,id:number) => apiBinaryRequest(`/api/library/${id}/qr`,{token}),
  archive: (token:string,configIds:number[]) => apiBinaryRequest('/api/library/archive',{token,method:'POST',body:{configIds}}),
  enqueue: (token:string,body:BatchRequest) => apiRequest<GenerationJob>('/api/generation/jobs',{token,method:'POST',body}),
  jobs: (token:string) => apiRequest<GenerationJob[]>('/api/generation/jobs',{token}),
  retry: (token:string,id:string) => apiRequest<GenerationJob>(`/api/generation/jobs/${id}/retry`,{token,method:'POST'}),
  notifications: (token:string) => apiRequest<Notification[]>('/api/notifications',{token}),
  read: (token:string,id:number) => apiRequest<void>(`/api/notifications/${id}/read`,{token,method:'POST'}),
}

export function downloadBlob(blob:Blob,name:string) {
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a');link.href=url;link.download=name;link.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function queueChanged() { window.dispatchEvent(new Event('inoagent:queue-changed')) }
