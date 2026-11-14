import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/auth-context'
import { workflowApi, queueChanged, type Notification } from '../api/workflowApi'
import {ServerName} from './ServerName'
import {BusyLabel} from './LoaderBlock'

export function ServerNotifications() {
  const {token}=useAuth()
  const [rows,setRows]=useState<Notification[]>([])
  const [busy,setBusy]=useState<number|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{
    if(!token) return
    let active=true
    const load=()=>{void workflowApi.notifications(token).then(result=>{if(active) setRows(result)}).catch(()=>{})}
    load();const timer=setInterval(load,30000)
    return()=>{active=false;clearInterval(timer)}
  },[token])
  if(!rows.length) return null
  const unread=rows.filter(r=>!r.read)
  async function read(id:number) { if(token) {await workflowApi.read(token,id);setRows(rs=>rs.map(r=>r.id===id?{...r,read:true}:r))} }
  async function generate(row:Notification) {
    if(!token) return
    setBusy(row.id);setError('')
    try { await workflowApi.enqueue(token,{serverId:row.serverId,requestKey:crypto.randomUUID()});queueChanged();await read(row.id) }
    catch(e) {setError(e instanceof Error?e.message:'Не удалось добавить задание')}
    finally {setBusy(null)}
  }
  return <details className="panel-card notifications-panel mb-4" open={unread.length>0 || undefined}><summary>Новые серверы {unread.length>0 && <span className="signal up">Непрочитано: {unread.length}</span>}</summary>
    {error && <p role="alert">{error}</p>}
    {rows.slice(0,10).map(row=><article className="notification-row" key={row.id}><div><ServerName id={row.serverId} name={row.serverName} location={row.location}/>{row.comment && <p className="mb-0 mt-2" style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{row.comment}</p>}<p className="text-secondary mb-0 mt-2">{new Date(row.createdAt).toLocaleDateString('ru-RU')}</p></div><div className="d-flex flex-wrap gap-2"><Link className="btn btn-sm btn-outline-light" to={`/configurations?server=${row.serverId}`} onClick={()=>{void read(row.id)}}>Открыть</Link><button className="btn btn-sm btn-primary" disabled={busy===row.id} onClick={()=>{void generate(row)}}><BusyLabel busy={busy===row.id}>{busy===row.id?'Добавляем…':'Выпустить для всех моих устройств'}</BusyLabel></button>{!row.read && <button className="btn btn-sm btn-outline-secondary" onClick={()=>{void read(row.id)}}>Прочитано</button>}</div></article>)}
  </details>
}
