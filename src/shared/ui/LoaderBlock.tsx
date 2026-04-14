type LoaderBlockProps = {
  label: string
  fullHeight?: boolean
}

export function LoaderBlock({ label, fullHeight = false }: LoaderBlockProps) {
  return (
    <div className={fullHeight ? 'loader-wrap loader-wrap-full' : 'loader-wrap'}>
      <div className="spinner-border text-light" role="status" />
      <span>{label}</span>
    </div>
  )
}
