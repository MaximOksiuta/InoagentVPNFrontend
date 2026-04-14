import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../app/providers/auth-context'
import { ApiError } from '../../shared/api/http'
import { serversApi } from '../../shared/api/serversApi'
import type { ServerResponse, UpsertServerRequest } from '../../shared/api/types'
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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  useEffect(() => {
    if (!token) return

    void loadServers(token)
  }, [loadServers, token])

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

  if (isLoading) {
    return <LoaderBlock label="Загружаем серверы" />
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

        {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
      </div>
    </div>
  )
}
