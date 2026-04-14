type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-badge">empty</div>
      <h3 className="h4 mb-2">{title}</h3>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  )
}
