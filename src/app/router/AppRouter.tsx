import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '../../features/auth/AuthPage'
import { ResetPasswordPage } from '../../features/auth/ResetPasswordPage'
import { DevicesPage } from '../../features/devices/DevicesPage'
import { ConfigurationsPage } from '../../features/configurations/ConfigurationsPage'
import { ServersPage } from '../../features/servers/ServersPage'
import { LoaderBlock } from '../../shared/ui/LoaderBlock'
import { AppShell } from '../layout/AppShell'
import { useAuth } from '../providers/auth-context'

function ProtectedRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return <LoaderBlock label="Проверяем сессию" fullHeight />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <Navigate to="/devices" replace />
}

function DevicesRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) return <LoaderBlock label="Загружаем кабинет" fullHeight />
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  return (
    <AppShell
      title="Ваши устройства"
      subtitle="Создавайте устройства, обновляйте их названия и сразу выпускайте конфигурации на выбранные серверы."
    >
      <DevicesPage />
    </AppShell>
  )
}

function ServersRoute() {
  const { isAuthenticated, isReady, user } = useAuth()

  if (!isReady) return <LoaderBlock label="Проверяем доступ" fullHeight />
  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (!user?.isAdmin) return <Navigate to="/devices" replace />

  return (
    <AppShell
      title="Пул серверов"
      subtitle="Администратор управляет карточками серверов, которые потом доступны пользователям для генерации конфигураций."
    >
      <ServersPage />
    </AppShell>
  )
}

function ConfigurationsRoute() {
  const {isAuthenticated,isReady}=useAuth()
  if(!isReady) return <LoaderBlock label="Загружаем конфигурации" fullHeight/>
  if(!isAuthenticated) return <Navigate to="/auth" replace/>
  return <AppShell title="Конфигурации" subtitle="По серверам и устройствам. Выпускайте, скачивайте и передавайте готовые файлы"><ConfigurationsPage/></AppShell>
}

function PublicOnlyRoute() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) return <LoaderBlock label="Подготавливаем форму входа" fullHeight />
  if (isAuthenticated) return <Navigate to="/devices" replace />

  return <AuthPage />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute />} />
        <Route path="/auth" element={<PublicOnlyRoute />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/devices" element={<DevicesRoute />} />
        <Route path="/configurations" element={<ConfigurationsRoute />} />
        <Route path="/servers" element={<ServersRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
