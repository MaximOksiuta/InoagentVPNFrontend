import {BrandMark} from './Brand'

type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <BrandMark className="empty-route-mark"/>
      <h3 className="h4 mb-2">{title}</h3>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  )
}
