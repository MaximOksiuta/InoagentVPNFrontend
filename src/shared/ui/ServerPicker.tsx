import {useEffect,useRef} from 'react'
import {ServerName} from './ServerName'

type Option={id:number;name:string;location:string}
export function ServerPicker({servers,value,onChange}:{servers:Option[];value:number;onChange:(id:number)=>void}) {
  const ref=useRef<HTMLDetailsElement>(null)
  const chosen=servers.find(s=>s.id===value)
  useEffect(()=>{
    const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node) && ref.current) ref.current.open=false}
    document.addEventListener('pointerdown',outside)
    return()=>document.removeEventListener('pointerdown',outside)
  },[])
  return <details className="server-picker" ref={ref} onKeyDown={e=>{if(e.key==='Escape' && ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus()}}}>
    <summary aria-label="Выбрать сервер" aria-disabled={!servers.length} onClick={e=>{if(!servers.length) e.preventDefault()}}>{chosen?<ServerName id={chosen.id} name={chosen.name} location={chosen.location}/>:<span>Нет доступных серверов</span>}<span className="picker-chevron" aria-hidden="true"/></summary>
    <div className="server-picker-options" role="group" aria-label="Доступные серверы">{servers.map(s=><button key={s.id} type="button" aria-pressed={s.id===value} onClick={()=>{onChange(s.id);if(ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus()}}}><ServerName id={s.id} name={s.name} location={s.location}/>{s.id===value && <span className="picker-selected" aria-hidden="true">✓</span>}</button>)}</div>
  </details>
}
