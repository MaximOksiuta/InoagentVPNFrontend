import type {ReactNode} from 'react'

type LoaderBlockProps = {
  label: string
  fullHeight?: boolean
}

export function LoaderBlock({ label, fullHeight = false }: LoaderBlockProps) {
  return (
    <div className={fullHeight ? 'loader-wrap loader-wrap-full' : 'loader-wrap'} role="status" aria-live="polite">
      <RouteLoader/>
      <span>{label}</span>
    </div>
  )
}

export function RouteLoader({compact=false}:{compact?:boolean}) {
  return <svg className={`route-loader ${compact?'route-loader-compact':''}`} viewBox="0 0 100 64" fill="none" aria-hidden="true">
    <path className="loader-rail" d="M12 32h14q10 0 10-10V16q0-8 8-8h12q8 0 8 8v32q0 8-8 8H44q-8 0-8-8v-6q0-10 10-10h42"/>
    <path className="loader-packet" pathLength="100" d="M12 32h14q10 0 10-10V16q0-8 8-8h12q8 0 8 8v32q0 8-8 8H44q-8 0-8-8v-6q0-10 10-10h42"/>
    <circle cx="12" cy="32" r="4"/><circle cx="88" cy="32" r="4"/>
    <path className="loader-junction" d="m45 32 5-5 5 5-5 5Z"/>
  </svg>
}

export function BusyLabel({busy,children}:{busy:boolean;children:ReactNode}) {
  return <span className="busy-label">{busy && <RouteLoader compact/>}{children}</span>
}
