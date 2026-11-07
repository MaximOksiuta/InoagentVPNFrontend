import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/auth-context'
import { apiRequest } from '../api/http'
import {ServerName} from './ServerName'
import {LoaderBlock,RouteLoader} from './LoaderBlock'

type Status = {id: number; name: string; location: string; hostReachable: boolean; latencyMs: number | null; checkedAt: number; probeUrl: string | null}
type ClientStatus = {state: 'checking' | 'up' | 'unknown' | 'unconfigured'; ms?: number}

export function ServerStatuses() {
  const {token} = useAuth()
  const [servers, setServers] = useState<Status[]>([])
  const [client, setClient] = useState<Record<number, ClientStatus>>({})
  const [error, setError] = useState('')
  const [loaded,setLoaded]=useState(false)
  useEffect(() => {
    if (!token) return
    let active = true
    const controllers = new Set<AbortController>()
    async function refresh() {
      try {
        const rows = await apiRequest<Status[]>('/api/servers/status', {token: token!})
        if (!active) return
        setServers(rows); setError('');setLoaded(true)
        await Promise.all(rows.map(async row => {
          if (!row.probeUrl) { if (active) setClient(c => ({...c, [row.id]: {state:'unconfigured'}})); return }
          const controller = new AbortController(); controllers.add(controller)
          const timeout = setTimeout(() => controller.abort(), 5000)
          const start = performance.now()
          if (active) setClient(c => ({...c, [row.id]: {state:'checking'}}))
          try {
            const response = await fetch(`${row.probeUrl}?t=${Date.now()}`, {cache:'no-store', credentials:'omit', signal:controller.signal})
            const payload = await response.json()
            if (active) setClient(c => ({...c, [row.id]: {state:response.ok && payload.status === 'ok' ? 'up' : 'unknown', ms:Math.round(performance.now()-start)}}))
          } catch { if (active) setClient(c => ({...c, [row.id]: {state:'unknown'}})) }
          finally { clearTimeout(timeout); controllers.delete(controller) }
        }))
      } catch { if (active) {setError('Не удалось обновить статусы');setLoaded(true)} }
    }
    void refresh()
    const interval = setInterval(() => { void refresh() }, 30000)
    return () => { active = false; clearInterval(interval); controllers.forEach(c => c.abort()) }
  }, [token])
  return <section className="panel-card status-panel mb-4" aria-label="Доступность серверов">
    <div className="status-heading"><div><h2 className="panel-title">Связь с серверами</h2><p className="panel-subtitle">Две независимые проверки · обновление каждые 30 секунд</p></div><span className="status-caption">TCP с хоста / HTTPS с устройства</span></div>
    {error && <p role="alert">{error}</p>}
    <div className="status-table"><div className="status-row status-labels"><span>Сервер</span><span>С хоста</span><span>С устройства</span></div>
    {!loaded && <LoaderBlock label="Ищем доступные маршруты"/>}
    {servers.map(s => <div className="status-row" key={s.id}><ServerName id={s.id} name={s.name} location={s.location}/><span className={s.hostReachable?'signal up':'signal down'}>{s.hostReachable?`${s.latencyMs} мс`:'Нет связи'}</span><span className={client[s.id]?.state==='up'?'signal up':'signal unknown'}>{client[s.id]?.state==='up'?`${client[s.id].ms} мс`:client[s.id]?.state==='unconfigured'?'Не настроено':client[s.id]?.state==='unknown'?'Не подтверждено':<span className="busy-label"><RouteLoader compact/>Проверяем…</span>}</span></div>)}
    </div><p className="status-caption mt-3 mb-0">Проверки показывают доступность узла, а не качество VPN-туннеля. «Не подтверждено» может означать блокировку, отсутствие сети или ошибку HTTPS</p>
  </section>
}
