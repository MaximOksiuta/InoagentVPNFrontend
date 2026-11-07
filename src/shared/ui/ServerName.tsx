import {useState} from 'react'
import {BrandMark} from './Brand'

export function ServerName({id,name,location,className=''}:{id:number;name:string;location?:string;className?:string}) {
  const src=`${(import.meta.env.VITE_API_BASE_URL?.trim() || '').replace(/\/$/,'')}/api/server-art/${id}?v=${encodeURIComponent(name.trim().toLowerCase())}`
  const [failed,setFailed]=useState('')
  return <span className={`server-identity ${className}`}>
    <span className="server-art">{failed===src?<BrandMark/>:<img key={src} src={src} alt="" width="56" height="42" loading="lazy" decoding="async" onError={()=>setFailed(src)}/>}</span>
    <span className="server-identity-copy"><span className="server-identity-name">{name}</span>{location && <small>{location}</small>}</span>
  </span>
}
