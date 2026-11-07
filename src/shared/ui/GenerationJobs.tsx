import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/auth-context'
import { workflowApi, queueChanged, type GenerationJob } from '../api/workflowApi'
import {ServerName} from './ServerName'
import {RouteLoader} from './LoaderBlock'

const labels:Record<string,string>={queued:'В очереди',running:'Выпускаем',done:'Готово',skipped:'Уже есть или в очереди',failed:'Ошибка',partial:'Есть ошибки',completed:'Завершено'}
export function GenerationJobs() {
  const {token}=useAuth()
  const [jobs,setJobs]=useState<GenerationJob[]>([])
  const [error,setError]=useState('')
  const previous=useRef<Record<string,string>>({})
  useEffect(()=>{
    if(!token) return
    let active=true
    const refresh=async()=>{
      try {
        const rows=await workflowApi.jobs(token)
        if(!active) return
        if(rows.some(j=>previous.current[j.id] && ['queued','running'].includes(previous.current[j.id]) && ['completed','partial'].includes(j.state))) window.dispatchEvent(new Event('inoagent:configs-changed'))
        previous.current=Object.fromEntries(rows.map(j=>[j.id,j.state]))
        setJobs(rows);setError('')
      } catch { if(active) setError('Очередь временно недоступна') }
    }
    const listener=()=>{void refresh()}
    void refresh();const timer=setInterval(listener,3000)
    window.addEventListener('inoagent:queue-changed',listener)
    return()=>{active=false;clearInterval(timer);window.removeEventListener('inoagent:queue-changed',listener)}
  },[token])
  if(!jobs.length && !error) return null
  const active=jobs.some(j=>['queued','running'].includes(j.state))
  return <details className="panel-card queue-panel mb-4" open={active || undefined}><summary>Очередь конфигураций <span className="text-secondary">{jobs.filter(j=>['queued','running'].includes(j.state)).length} активных заданий</span></summary>
    {error && <p role="alert">{error}</p>}
    {jobs.slice(0,10).map(job=>{
      const complete=job.items.filter(i=>!['queued','running'].includes(i.state)).length
      return <section className="queue-job" key={job.id}>
        <div className="d-flex justify-content-between align-items-center gap-3"><ServerName id={job.serverId} name={job.serverName}/><span className="busy-label">{['queued','running'].includes(job.state) && <RouteLoader compact/>}{labels[job.state]} · {complete}/{job.items.length}</span></div>
        <progress aria-label={`Прогресс ${job.serverName}`} max={job.items.length} value={complete}/>
        <details><summary className="small text-secondary">Устройства и результаты</summary><ul className="queue-items">{job.items.map(i=><li key={i.deviceId}><span>{i.userName} · {i.deviceName}</span><span className={i.state==='failed'?'text-danger':''}>{labels[i.state]}{i.error ? ` · ${i.error}` : ''}</span></li>)}</ul></details>
        <div className="d-flex gap-3 mt-3"><Link to={`/configurations?server=${job.serverId}`}>Открыть конфигурации</Link>{job.state==='partial' && <button className="btn btn-sm btn-outline-light" onClick={()=>{if(token) void workflowApi.retry(token,job.id).then(queueChanged).catch(()=>setError('Не удалось повторить задание'))}}>Повторить ошибки</button>}</div>
      </section>
    })}
  </details>
}
