import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../app/providers/auth-context'
import { ApiError } from '../../shared/api/http'
import { serversApi } from '../../shared/api/serversApi'
import { usersApi } from '../../shared/api/usersApi'
import type { AdminUserResponse, ServerResponse, UpsertServerRequest } from '../../shared/api/types'
import { EmptyState } from '../../shared/ui/EmptyState'
import { LoaderBlock } from '../../shared/ui/LoaderBlock'

const emptyServerForm: UpsertServerRequest = {
  name: '',
  location: '',
  host: '',
  port: 22,
  username: '',
  password: null,
  sshKeyPath: null,
  containerName: '',
  containerConfigDir: '',
  interfaceName: '',
}

export function ServersPage() {
  const { token } = useAuth()
  const [servers, setServers] = useState<ServerResponse[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [form, setForm] = useState<UpsertServerRequest>(emptyServerForm)
  const [users, setUsers] = useState<AdminUserResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeUserActionId, setActiveUserActionId] = useState<number | null>(null)

  const selectServer = useCallback((serverId: number | null, source: ServerResponse[]) => {
    setSelectedServerId(serverId)
    const server = source.find((item) => item.id === serverId)

    if (!server) {
      setForm(emptyServerForm)
      return
    }

    setForm({
      name: server.name,
      location: server.location,
      host: server.host,
      port: server.port,
      username: server.username,
      password: server.password ?? null,
      sshKeyPath: server.sshKeyPath ?? null,
      containerName: server.containerName,
      containerConfigDir: server.containerConfigDir,
      interfaceName: server.interfaceName,
    })
  }, [])

  const loadServers = useCallback(async (currentToken: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const list = await serversApi.list(currentToken)
      const detailed = await Promise.all(list.map((server) => serversApi.get(currentToken, server.id)))
      setServers(detailed)

      if (detailed[0]) {
        selectServer(detailed[0].id, detailed)
      } else {
        setSelectedServerId(null)
        setForm(emptyServerForm)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить серверы.')
    } finally {
      setIsLoading(false)
    }
  }, [selectServer])

  const loadUsers = useCallback(async (currentToken: string) => {
    const usersList = await usersApi.list(currentToken)
    setUsers(usersList)
  }, [])

  useEffect(() => {
    if (!token) return
    const currentToken = token

    async function bootstrap() {
      setIsLoading(true)
      setError(null)

      try {
        await Promise.all([loadServers(currentToken), loadUsers(currentToken)])
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные администратора.')
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [loadServers, loadUsers, token])

  function updateField<Key extends keyof UpsertServerRequest>(
    field: Key,
    value: UpsertServerRequest[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setIsSaving(true)
    setError(null)

    try {
      const payload: UpsertServerRequest = {
        ...form,
        password: form.password?.trim() ? form.password : null,
        sshKeyPath: form.sshKeyPath?.trim() ? form.sshKeyPath : null,
      }

      if (selectedServerId) {
        const updated = await serversApi.update(token, selectedServerId, payload)
        const nextServers = servers.map((server) =>
          server.id === updated.id ? updated : server,
        )
        setServers(nextServers)
        selectServer(updated.id, nextServers)
      } else {
        const created = await serversApi.create(token, payload)
        const nextServers = [...servers, created]
        setServers(nextServers)
        selectServer(created.id, nextServers)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить сервер.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!token || !selectedServerId) return

    setIsSaving(true)
    setError(null)

    try {
      await serversApi.remove(token, selectedServerId)
      const nextServers = servers.filter((server) => server.id !== selectedServerId)
      setServers(nextServers)
      selectServer(nextServers[0]?.id ?? null, nextServers)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить сервер.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApproveUser(userId: number) {
    if (!token) return

    setActiveUserActionId(userId)
    setError(null)

    try {
      const updated = await usersApi.approve(token, userId)
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось подтвердить пользователя.')
    } finally {
      setActiveUserActionId(null)
    }
  }

  async function handleBanUser(userId: number) {
    if (!token) return

    setActiveUserActionId(userId)
    setError(null)

    try {
      const updated = await usersApi.ban(token, userId)
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось заблокировать пользователя.')
    } finally {
      setActiveUserActionId(null)
    }
  }

  function getUserStatus(user: AdminUserResponse) {
    if (user.isBanned) return { label: 'Заблокирован', className: 'text-bg-danger' }
    if (user.isApproved) return { label: 'Подтвержден', className: 'text-bg-success' }
    return { label: 'Ожидает одобрения', className: 'text-bg-warning' }
  }

  if (isLoading) {
    return <LoaderBlock label="Загружаем панель администратора" />
  }

  return (
    <div className="row g-4">
      <div className="col-xl-4">
        <section className="panel-card h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="panel-title mb-1">Список серверов</h2>
              <p className="panel-subtitle mb-0">Администрируемая сущность из API</p>
            </div>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={() => selectServer(null, servers)}
            >
              Новый сервер
            </button>
          </div>

          {servers.length === 0 ? (
            <EmptyState
              title="Серверы отсутствуют"
              description="Создайте первый сервер, чтобы пользователи могли генерировать конфигурации."
            />
          ) : (
            <div className="device-list">
              {servers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  className={`device-list-item ${
                    selectedServerId === server.id ? 'device-list-item-active' : ''
                  }`}
                  onClick={() => selectServer(server.id, servers)}
                >
                  <span>
                    <strong>{server.name}</strong>
                    <small>{server.location}</small>
                  </span>
                  <span className="device-chevron">Edit</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="col-xl-8">
        <div className="vstack gap-4">
          <section className="panel-card">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
              <div>
                <h2 className="panel-title mb-1">
                  {selectedServerId ? `Редактирование server #${selectedServerId}` : 'Новый сервер'}
                </h2>
                <p className="panel-subtitle mb-0">
                  Все поля соответствуют `UpsertServerRequest` из контракта
                </p>
              </div>

              {selectedServerId ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={isSaving}
                  onClick={() => void handleDelete()}
                >
                  Удалить сервер
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Название</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Локация</label>
                <input
                  className="form-control"
                  value={form.location}
                  onChange={(event) => updateField('location', event.target.value)}
                />
              </div>
              <div className="col-md-8">
                <label className="form-label">Host</label>
                <input
                  className="form-control"
                  value={form.host}
                  onChange={(event) => updateField('host', event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Port</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.port}
                  onChange={(event) => updateField('port', Number(event.target.value))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Username</label>
                <input
                  className="form-control"
                  value={form.username}
                  onChange={(event) => updateField('username', event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  value={form.password ?? ''}
                  onChange={(event) => updateField('password', event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">SSH key path</label>
                <input
                  className="form-control"
                  value={form.sshKeyPath ?? ''}
                  onChange={(event) => updateField('sshKeyPath', event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Container name</label>
                <input
                  className="form-control"
                  value={form.containerName}
                  onChange={(event) => updateField('containerName', event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Interface</label>
                <input
                  className="form-control"
                  value={form.interfaceName}
                  onChange={(event) => updateField('interfaceName', event.target.value)}
                />
              </div>
              <div className="col-md-12">
                <label className="form-label">Container config dir</label>
                <input
                  className="form-control"
                  value={form.containerConfigDir}
                  onChange={(event) => updateField('containerConfigDir', event.target.value)}
                />
              </div>
              <div className="col-12 d-grid d-md-flex justify-content-md-end">
                <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
                  {isSaving ? 'Сохраняем...' : selectedServerId ? 'Сохранить изменения' : 'Создать сервер'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="panel-title mb-1">Пользователи</h2>
                <p className="panel-subtitle mb-0">
                  Новые аккаунты должны быть подтверждены администратором перед первым входом
                </p>
              </div>
              <span className="badge text-bg-light">{users.length}</span>
            </div>

            {users.length === 0 ? (
              <EmptyState
                title="Пользователей нет"
                description="После регистрации новые аккаунты появятся в этом списке."
              />
            ) : (
              <div className="vstack gap-3">
                {users.map((user) => {
                  const status = getUserStatus(user)

                  return (
                    <article key={user.id} className="config-card">
                      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <h3 className="h5 mb-0">{user.nickname}</h3>
                            <span className={`badge ${status.className}`}>{status.label}</span>
                            {user.isAdmin ? <span className="badge text-bg-dark">admin</span> : null}
                          </div>
                          <div className="text-secondary">{user.phone}</div>
                          <div className="small text-secondary mt-1">user #{user.id}</div>
                        </div>

                        <div className="d-flex flex-wrap gap-2 align-self-start">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={activeUserActionId === user.id || user.isApproved}
                            onClick={() => void handleApproveUser(user.id)}
                          >
                            {activeUserActionId === user.id ? 'Сохраняем...' : 'Подтвердить'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={activeUserActionId === user.id || user.isBanned}
                            onClick={() => void handleBanUser(user.id)}
                          >
                            {activeUserActionId === user.id ? 'Сохраняем...' : 'Заблокировать'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </div>
    </div>
  )
}
