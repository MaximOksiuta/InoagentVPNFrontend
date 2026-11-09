import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/auth-context'
import { apiRequest } from '../api/http'
import {ServerName} from './ServerName'
import {LoaderBlock,RouteLoader} from './LoaderBlock'

type Status = {
  id: number
  name: string
  location: string
  hostReachable: boolean
  latencyMs: number | null
  pingReachable?: boolean | null
  pingLatencyMs?: number | null
  probeUrl: string | null
}
type ClientStatus = {state: 'checking' | 'up' | 'unknown'; ms?: number}

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
          if (!row.probeUrl) { if (active) setClient(c => ({...c, [row.id]: {state:'unknown'}})); return }
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
    <div className="status-heading">
      <div><h2 className="panel-title">Связь с серверами</h2><p className="panel-subtitle">Обновление каждые 30 секунд</p></div>
      <span className="status-caption">Пинг и SSH с хоста · HTTPS с устройства</span>
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="status-table"><div className="status-row status-labels"><span>Сервер</span><span>С хоста</span><span>С устройства</span></div>
    {!loaded && <LoaderBlock label="Ищем доступные маршруты"/>}
    {servers.map(s => {
      const device = client[s.id]
      return <div className="status-row" key={s.id}>
        <ServerName id={s.id} name={s.name} location={s.location}/>
        <div className="host-signals">
          <span className={`signal ${s.pingReachable === true ? 'up' : 'unknown'}`}>
            Пинг · {s.pingReachable === true
              ? s.pingLatencyMs == null ? 'ответил' : `${s.pingLatencyMs} мс`
              : s.pingReachable === false ? 'нет ответа' : 'недоступен'}
          </span>
          <span className={`signal ${s.hostReachable ? 'up' : 'down'}`}>
            SSH · {s.hostReachable ? `${s.latencyMs} мс` : 'нет связи'}
          </span>
        </div>
        <span className={`signal ${device?.state === 'up' ? 'up' : 'unknown'}`}>
          {device?.state === 'up' ? `${device.ms} мс` : device?.state === 'unknown'
            ? 'Не подтверждено'
            : <span className="busy-label"><RouteLoader compact/>Проверяем…</span>}
        </span>
      </div>
    })}
    </div><p className="status-caption mt-3 mb-0">Пинг может блокироваться при рабочем SSH. Проверка с устройства требует ответа по HTTPS. Работу VPN-туннеля проверяйте подключением.</p>
  </section>
}
