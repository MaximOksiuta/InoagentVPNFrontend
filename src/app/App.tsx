import { AuthProvider } from './providers/AuthProvider'
import { AppRouter } from './router/AppRouter'

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
