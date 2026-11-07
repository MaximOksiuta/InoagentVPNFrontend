import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/auth-context'
import { workflowApi, downloadBlob, queueChanged, type CatalogEntry, type CatalogPage } from '../../shared/api/workflowApi'
import { usersApi } from '../../shared/api/usersApi'
import type { AdminUserResponse } from '../../shared/api/types'
import { formatPhone } from '../../shared/lib/phone'
import {ServerName} from '../../shared/ui/ServerName'
import {LoaderBlock} from '../../shared/ui/LoaderBlock'

const empty:CatalogPage={entries:[],total:0,servers:[]}
export function ConfigurationsPage() {
  const {token,user}=useAuth()
  const [searchParams,setSearchParams]=useSearchParams()
  const server=searchParams.get('server') || ''
  const [all,setAll]=useState(Boolean(user?.isAdmin))
  const [owner,setOwner]=useState('')
  const [search,setSearch]=useState('')
  const [offset,setOffset]=useState(0)
  const [revision,setRevision]=useState(0)
  const [data,setData]=useState<CatalogPage>(empty)
  const [users,setUsers]=useState<AdminUserResponse[]>([])
  const [selected,setSelected]=useState<number[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [preview,setPreview]=useState<{entry:CatalogEntry;text?:string;qr?:string}|null>(null)
  const [confirmBatch,setConfirmBatch]=useState(false)
  function params(start=offset) {
    return new URLSearchParams({all:String(all),...(server?{serverId:server}:{}),...(owner && all?{userId:owner}:{}),query:search,offset:String(start),limit:'50'})
  }
  useEffect(()=>{
    if(!token) return
    let active=true
    const timer=setTimeout(()=>{
      setLoading(true)
      const q=new URLSearchParams({all:String(all),...(server?{serverId:server}:{}),...(owner && all?{userId:owner}:{}),query:search,offset:String(offset),limit:'50'})
      void workflowApi.catalog(token,q).then(page=>{if(active){setData(page);setError('')}}).catch(e=>{if(active) setError(e instanceof Error?e.message:'Не удалось загрузить конфигурации')}).finally(()=>{if(active) setLoading(false)})
    },200)
    return()=>{active=false;clearTimeout(timer)}
  },[token,all,server,owner,search,offset,revision])
  useEffect(()=>{
    if(!token || !user?.isAdmin) return
    void usersApi.list(token).then(setUsers).catch(()=>{})
  },[token,user?.isAdmin])
  useEffect(()=>{const listener=()=>setRevision(r=>r+1);window.addEventListener('inoagent:configs-changed',listener);return()=>window.removeEventListener('inoagent:configs-changed',listener)},[])
  useEffect(()=>()=>{if(preview?.qr) URL.revokeObjectURL(preview.qr)},[preview])
  useEffect(()=>{
    if(!preview) return
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape') setPreview(null)}
    window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)
  },[preview])
  function resetPage(){setOffset(0);setSelected([]);setNotice('')}
  function pickServer(id:string){setSearchParams(id?{server:id}:{});resetPage()}
  async function download(entry:CatalogEntry) {
    if(!token) return
    setBusy(`file-${entry.id}`);setError('')
    try { const response=await workflowApi.file(token,entry.id);downloadBlob(response.blob,`user-${entry.userId}_${entry.deviceName.replace(/[\\/]/g,'_')}_${entry.serverName.replace(/[\\/]/g,'_')}_${entry.id}.conf`) }
    catch(e){setError(e instanceof Error?e.message:'Не удалось скачать конфигурацию')}
    finally{setBusy('')}
  }
  async function show(entry:CatalogEntry,qr=false) {
    if(!token) return
    setBusy(`show-${entry.id}`);setError('')
    try {
      if(qr){const response=await workflowApi.qr(token,entry.id);setPreview({entry,qr:URL.createObjectURL(response.blob)})}
      else {const response=await workflowApi.text(token,entry.id);setPreview({entry,text:response.config})}
    } catch(e){setError(e instanceof Error?e.message:'Не удалось открыть конфигурацию')}
    finally{setBusy('')}
  }
  async function archive(filtered=false) {
    if(!token) return
    setBusy('archive');setError('')
    try {
      let ids=selected
      if(filtered) {
        if(data.total>1000) throw new Error('В архиве может быть до 1000 конфигураций. Уточните фильтр')
        ids=[]
        for(let start=0;start<data.total;start+=50){const page=await workflowApi.catalog(token,params(start));ids.push(...page.entries.map(e=>e.id))}
      }
      if(!ids.length) throw new Error('Выберите конфигурации')
      const response=await workflowApi.archive(token,ids);downloadBlob(response.blob,'inoagent-configs.zip')
    }catch(e){setError(e instanceof Error?e.message:'Не удалось скачать архив')}
    finally{setBusy('')}
  }
  const selectedServer=data.servers.find(s=>String(s.id)===server)
  async function generate(confirmed=false) {
    if(!token || !selectedServer) return
    if(all && !confirmed) {setConfirmBatch(true);return}
    setConfirmBatch(false)
    setBusy('generate');setError('');setNotice('')
    try {
      const job=await workflowApi.enqueue(token,{serverId:selectedServer.id,allUsers:all,...(all && owner?{userId:Number(owner)}:{}),requestKey:crypto.randomUUID()})
      queueChanged();setNotice(`Задание добавлено: ${job.items.length} устройств. Прогресс — в очереди выше`)
    }catch(e){setError(e instanceof Error?e.message:'Не удалось добавить задание')}
    finally{setBusy('')}
  }
  return <div className="catalog-layout">
    <aside className="panel-card catalog-sidebar"><h2 className="panel-title">По серверам</h2><button className={`catalog-server ${!server?'selected':''}`} onClick={()=>pickServer('')}>Все серверы</button>
      {data.servers.map(s=><button key={s.id} className={`catalog-server ${server===String(s.id)?'selected':''}`} onClick={()=>pickServer(String(s.id))}><ServerName id={s.id} name={s.name} location={`${s.location}${s.archived?' · архив':''}`}/><span>{s.configCount}</span></button>)}
    </aside>
    <section className="panel-card catalog-main">
      <div className="catalog-title"><div><h2 className="panel-title mb-1">{selectedServer?<ServerName id={selectedServer.id} name={selectedServer.name}/>: 'Все конфигурации'}</h2><p className="panel-subtitle mb-0">{data.total} конфигураций · {all?'все пользователи':'только ваши устройства'}</p></div>
        {user?.isAdmin && <div className="d-flex gap-2"><button className={`btn btn-sm ${all?'btn-primary':'btn-outline-light'}`} onClick={()=>{setAll(true);resetPage()}}>Все пользователи</button><button className={`btn btn-sm ${!all?'btn-primary':'btn-outline-light'}`} onClick={()=>{setAll(false);resetPage()}}>Мои</button></div>}
      </div>
      <div className="catalog-filters"><label>Поиск<input className="form-control" placeholder="Устройство, пользователь, телефон" value={search} onChange={e=>{setSearch(e.target.value);resetPage()}}/></label>{all && <label>Пользователь<select className="form-select" value={owner} onChange={e=>{setOwner(e.target.value);resetPage()}}><option value="">Все пользователи</option>{users.map(u=><option key={u.id} value={u.id}>{u.nickname} · {formatPhone(u.phone)}</option>)}</select></label>}</div>
      {selectedServer && !selectedServer.archived && <div className="catalog-batch"><div><strong>Выпуск для всех устройств</strong><p className="text-secondary mb-0">Уже выпущенные конфиги пропускаются. Соединение VPN продолжает работать</p></div><button className="btn btn-primary" disabled={Boolean(busy)} onClick={()=>{void generate()}}>{busy==='generate'?'Добавляем…':all?(owner?'Для всех устройств пользователя':'Для всех устройств всех пользователей'):'Для всех моих устройств'}</button></div>}
      {notice && <p className="alert alert-success" role="status">{notice}</p>}{error && <p className="alert alert-danger" role="alert">{error}</p>}
      <div className="catalog-actions"><span className="text-secondary">{selected.length?`Выбрано: ${selected.length}`:'Файлы .conf, QR и ZIP'}</span><div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-light" disabled={!selected.length || Boolean(busy)} onClick={()=>{void archive()}}>Скачать выбранные · ZIP</button><button className="btn btn-sm btn-outline-light" disabled={!data.total || Boolean(busy)} onClick={()=>{void archive(true)}}>{busy==='archive'?'Готовим архив…':'Скачать всё по фильтру · ZIP'}</button></div></div>
      {busy && <LoaderBlock label={busy==='archive'?'Собираем конфигурации в архив':busy==='generate'?'Добавляем устройства в очередь':'Загружаем конфигурацию'}/>}
      <div className="catalog-table-wrap" aria-busy={loading}>{loading?<LoaderBlock label="Раскладываем конфигурации по серверам"/>:<><table className="catalog-table"><thead><tr><th><input type="checkbox" aria-label="Выбрать все на странице" checked={data.entries.length>0 && data.entries.every(e=>selected.includes(e.id))} onChange={e=>setSelected(e.target.checked?data.entries.map(r=>r.id):[])}/></th>{all && <th>Пользователь</th>}<th>Устройство</th><th>Сервер</th><th>Конфигурация</th></tr></thead><tbody>
        {data.entries.map(entry=><tr key={entry.id}><td><input type="checkbox" aria-label={`Выбрать ${entry.deviceName}, ${entry.userName}`} checked={selected.includes(entry.id)} onChange={e=>setSelected(ids=>e.target.checked?[...ids,entry.id]:ids.filter(id=>id!==entry.id))}/></td>{all && <td><strong>{entry.userName}</strong><small>{formatPhone(entry.userPhone || '')}</small></td>}<td><strong>{entry.deviceName}</strong><small>Устройство #{entry.deviceId}</small></td><td><ServerName id={entry.serverId} name={entry.serverName} location={`${entry.serverLocation}${entry.archived?' · архив':''}`}/></td><td><div className="catalog-row-actions"><button className="btn btn-sm btn-primary" disabled={Boolean(busy)} onClick={()=>{void download(entry)}}>Скачать .conf</button><button className="btn btn-sm btn-outline-light" disabled={Boolean(busy)} onClick={()=>{void show(entry,true)}}>QR</button><button className="btn btn-sm btn-outline-light" disabled={Boolean(busy)} onClick={()=>{void show(entry)}}>Текст</button></div></td></tr>)}
      </tbody></table>{!data.entries.length && <div className="empty-state mt-3"><h3>Конфигураций пока нет</h3><p>Выберите сервер и добавьте выпуск для ваших устройств в очередь</p></div>}</>}</div>
      <div className="catalog-pagination"><button className="btn btn-sm btn-outline-light" disabled={offset===0 || loading} onClick={()=>{setOffset(o=>Math.max(0,o-50));setSelected([])}}>Назад</button><span>{data.total?offset+1:0}–{Math.min(offset+50,data.total)} из {data.total}</span><button className="btn btn-sm btn-outline-light" disabled={offset+50>=data.total || loading} onClick={()=>{setOffset(o=>o+50);setSelected([])}}>Далее</button></div>
    </section>
    {confirmBatch && selectedServer && <div className="app-modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Подтверждение массового выпуска" className="panel-card app-modal"><h2 className="panel-title"><ServerName id={selectedServer.id} name={selectedServer.name}/></h2><p>{owner?'Для всех устройств выбранного пользователя':'Для всех устройств всех подтверждённых пользователей'}. Уже существующие конфигурации сохранятся. Новые появятся в очереди</p><div className="app-modal-actions"><button autoFocus className="btn btn-outline-light" onClick={()=>setConfirmBatch(false)}>Отмена</button><button className="btn btn-primary" onClick={()=>{void generate(true)}}>Добавить в очередь</button></div></section></div>}
    {preview && <div className="app-modal-backdrop" onClick={()=>setPreview(null)}><section role="dialog" aria-modal="true" aria-label={`Конфигурация ${preview.entry.deviceName}`} className="panel-card app-modal config-preview" onClick={e=>e.stopPropagation()}><div className="catalog-title"><div><h2 className="panel-title">{preview.entry.deviceName}</h2><p className="text-secondary">{preview.entry.userName}</p><ServerName id={preview.entry.serverId} name={preview.entry.serverName}/></div><button autoFocus className="btn btn-sm btn-outline-light" onClick={()=>setPreview(null)}>Закрыть</button></div>{preview.qr?<img className="qr-modal-image" src={preview.qr} alt={`QR конфигурации ${preview.entry.deviceName}`}/>:<pre className="config-output">{preview.text}</pre>}<button className="btn btn-primary mt-3" onClick={()=>{void download(preview.entry)}}>Скачать .conf</button></section></div>}
  </div>
}
