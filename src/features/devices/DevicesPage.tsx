import {useCallback, useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import {useAuth} from '../../app/providers/auth-context'
import {devicesApi} from '../../shared/api/devicesApi'
import {ApiError} from '../../shared/api/http'
import {serversApi} from '../../shared/api/serversApi'
import type {
    CreateDeviceRequest,
    DeviceDetailsResponse,
    DeviceResponse,
    DeviceServerResponse,
    ServerListItemResponse,
} from '../../shared/api/types'
import {EmptyState} from '../../shared/ui/EmptyState'
import {LoaderBlock} from '../../shared/ui/LoaderBlock'

export function DevicesPage() {
    const {token} = useAuth()
    const [devices, setDevices] = useState<DeviceResponse[]>([])
    const [servers, setServers] = useState<ServerListItemResponse[]>([])
    const [selectedDevice, setSelectedDevice] = useState<DeviceDetailsResponse | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [expandedConfigIds, setExpandedConfigIds] = useState<number[]>([])
    const [qrConfig, setQrConfig] = useState<DeviceServerResponse | null>(null)
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
    const [isQrLoading, setIsQrLoading] = useState(false)
    const [activeDownloadId, setActiveDownloadId] = useState<number | null>(null)
    const [newDeviceName, setNewDeviceName] = useState('')
    const [editedName, setEditedName] = useState('')
    const [selectedServerId, setSelectedServerId] = useState<number | ''>('')
    const [error, setError] = useState<string | null>(null)
    const [isBootstrapping, setIsBootstrapping] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    function formatConfigFilename(region: string, deviceName: string) {
        const normalize = (value: string) =>
            value
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_-]+/g, '')

        return `${normalize(region)}_${normalize(deviceName)}.conf`
    }

    const openDevice = useCallback(async (
        deviceId: number,
        currentToken: string,
        availableServers: ServerListItemResponse[],
    ) => {
        try {
            const details = await devicesApi.get(currentToken, deviceId)
            setSelectedDevice(details)
            setEditedName(details.name)
            setSelectedServerId(availableServers[0]?.id ?? '')
            setExpandedConfigIds([])
            setQrConfig(null)
            setQrImageUrl((current) => {
                if (current) URL.revokeObjectURL(current)
                return null
            })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось открыть устройство.')
        }
    }, [])

    const loadInitial = useCallback(async (currentToken: string) => {
        setIsBootstrapping(true)
        setError(null)

        try {
            const [devicesResponse, serversResponse] = await Promise.all([
                devicesApi.list(currentToken),
                serversApi.list(currentToken),
            ])
            setDevices(devicesResponse)
            setServers(serversResponse)

            if (devicesResponse.length > 0) {
                await openDevice(devicesResponse[0].id, currentToken, serversResponse)
            } else {
                setSelectedDevice(null)
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные.')
        } finally {
            setIsBootstrapping(false)
        }
    }, [openDevice])

    useEffect(() => {
        if (!token) return

        void loadInitial(token)
    }, [loadInitial, token])

    async function handleCreateDevice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!token) return
        if (!newDeviceName.trim()) {
            setError('Укажите название устройства.')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const payload: CreateDeviceRequest = {name: newDeviceName.trim()}
            const created = await devicesApi.create(token, payload)
            const nextDevices = [...devices, created]
            setDevices(nextDevices)
            setNewDeviceName('')
            await openDevice(created.id, token, servers)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось создать устройство.')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleRenameDevice(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!token || !selectedDevice) return

        setIsSaving(true)
        setError(null)

        try {
            const updated = await devicesApi.update(token, selectedDevice.id, {
                name: editedName.trim(),
            })
            setSelectedDevice(updated)
            setDevices((current) =>
                current.map((device) =>
                    device.id === updated.id ? {id: updated.id, name: updated.name} : device,
                ),
            )
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось обновить устройство.')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteDevice(deviceId: number) {
        if (!token) return

        setIsSaving(true)
        setError(null)

        try {
            await devicesApi.remove(token, deviceId)
            const nextDevices = devices.filter((device) => device.id !== deviceId)
            setDevices(nextDevices)

            if (selectedDevice?.id === deviceId) {
                if (nextDevices[0]) {
                    await openDevice(nextDevices[0].id, token, servers)
                } else {
                    setSelectedDevice(null)
                    setEditedName('')
                }
            }
            setIsDeleteModalOpen(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось удалить устройство.')
        } finally {
            setIsSaving(false)
        }
    }

    async function handleGenerateConfig(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!token || !selectedDevice || selectedServerId === '') return

        setIsGenerating(true)
        setError(null)

        try {
            const createdConfig = await devicesApi.generateConfig(token, selectedDevice.id, {
                serverId: selectedServerId,
            })

            setSelectedDevice((current) =>
                current
                    ? {
                        ...current,
                        configs: [
                            ...current.configs.filter((config) => config.id !== createdConfig.id),
                            createdConfig,
                        ],
                    }
                    : current,
            )
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось сгенерировать конфиг.')
        } finally {
            setIsGenerating(false)
        }
    }

    function toggleConfig(configId: number) {
        setExpandedConfigIds((current) =>
            current.includes(configId)
                ? current.filter((id) => id !== configId)
                : [...current, configId],
        )
    }

    async function handleDownloadConfig(config: DeviceServerResponse) {
        if (!token || !selectedDevice) return

        setActiveDownloadId(config.id)
        setError(null)

        try {
            const response = await devicesApi.downloadConfigFile(token, selectedDevice.id, config.id)
            const url = URL.createObjectURL(response.blob)
            const link = document.createElement('a')
            link.href = url
            link.download = formatConfigFilename(config.serverLocation, selectedDevice.name)
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось скачать файл конфигурации.')
        } finally {
            setActiveDownloadId(null)
        }
    }

    async function handleOpenQr(config: DeviceServerResponse) {
        if (!token || !selectedDevice) return

        setIsQrLoading(true)
        setError(null)

        try {
            const response = await devicesApi.getConfigQr(token, selectedDevice.id, config.id)
            setQrConfig(config)
            setQrImageUrl((current) => {
                if (current) URL.revokeObjectURL(current)
                return URL.createObjectURL(response.blob)
            })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не удалось получить QR-код.')
        } finally {
            setIsQrLoading(false)
        }
    }

    function closeQrModal() {
        setQrConfig(null)
        setQrImageUrl((current) => {
            if (current) URL.revokeObjectURL(current)
            return null
        })
    }

    if (isBootstrapping) {
        return <LoaderBlock label="Загружаем устройства и серверы"/>
    }

    return (
        <div className="row g-4">
            <div className="col-xl-4">
                <section className="panel-card h-100">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h2 className="panel-title mb-1">Мои девайсы</h2>
                            <p className="panel-subtitle mb-0">Создание и быстрый выбор устройства</p>
                        </div>
                        <span className="badge text-bg-light">{devices.length}</span>
                    </div>

                    <form onSubmit={handleCreateDevice} className="vstack gap-2 mb-4">
                        <input
                            className="form-control"
                            placeholder="Например, MacBook Air"
                            value={newDeviceName}
                            onChange={(event) => setNewDeviceName(event.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            Добавить устройство
                        </button>
                    </form>

                    {devices.length === 0 ? (
                        <EmptyState
                            title="Пока нет устройств"
                            description="Создайте первое устройство, чтобы затем выпустить для него конфигурацию."
                        />
                    ) : (
                        <div className="device-list">
                            {devices.map((device) => (
                                <button
                                    key={device.id}
                                    type="button"
                                    className={`device-list-item ${
                                        selectedDevice?.id === device.id ? 'device-list-item-active' : ''
                                    }`}
                                    onClick={() => token && void openDevice(device.id, token, servers)}
                                >
                  <span>
                    <strong>{device.name}</strong>
                    <small>ID {device.id}</small>
                  </span>
                                    <span className="device-chevron">Open</span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <div className="col-xl-8">
                {selectedDevice ? (
                    <div className="vstack gap-4">
                        <section className="panel-card">
                            <div className="panel-card-section">
                                <form onSubmit={handleRenameDevice} className="row g-3 align-items-end">
                                    <div className="col-md-8">
                                        <label className="form-label">Название</label>
                                        <input
                                            className="form-control"
                                            value={editedName}
                                            onChange={(event) => setEditedName(event.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4 d-grid">
                                        <button type="submit" className="btn btn-dark" disabled={isSaving}>
                                            Сохранить
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="panel-card-section panel-card-section-divider">
                                <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between mb-4">
                                    <div>
                                        <h2 className="panel-title mb-1">Генерация конфигурации</h2>
                                        <p className="panel-subtitle mb-0">
                                            Выберите сервер из общего списка и сохраните новый конфиг
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleGenerateConfig} className="row g-3 align-items-end">
                                    <div className="col-md-8">
                                        <label className="form-label">Сервер</label>
                                        <select
                                            className="form-select"
                                            value={selectedServerId}
                                            onChange={(event) => setSelectedServerId(Number(event.target.value))}
                                            disabled={servers.length === 0}
                                        >
                                            {servers.length === 0 ? (
                                                <option value="">Нет доступных серверов</option>
                                            ) : null}
                                            {servers.map((server) => (
                                                <option key={server.id} value={server.id}>
                                                    {server.name} · {server.location}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4 d-grid">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isGenerating || servers.length === 0}
                                        >
                                            {isGenerating ? 'Генерируем...' : 'Сгенерировать'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="panel-card-section panel-card-section-divider">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <h2 className="panel-title mb-1">Сохраненные конфиги</h2>
                                    </div>
                                    <span className="badge text-bg-light">{selectedDevice.configs.length}</span>
                                </div>

                                {selectedDevice.configs.length === 0 ? (
                                    <EmptyState
                                        title="Конфигов нет"
                                        description="Сгенерируйте первую конфигурацию, выбрав сервер выше."
                                    />
                                ) : (
                                    <div className="vstack gap-3">
                                        {selectedDevice.configs.map((config) => (
                                            <article key={config.id} className="config-card">
                                                <div
                                                    className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
                                                    <div>
                                                        <h3 className="h5 mb-1">{config.serverName}</h3>
                                                        <div className="text-secondary">
                                                            {config.serverLocation} · server #{config.serverId}
                                                        </div>
                                                    </div>
                                                    <span className="badge rounded-pill text-bg-dark align-self-start">config #{config.id}</span>
                                                </div>

                                                <div className="config-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-light btn-sm"
                                                        onClick={() => void handleOpenQr(config)}
                                                        disabled={isQrLoading}
                                                    >
                                                        {isQrLoading && qrConfig?.id === config.id ? 'Загружаем QR...' : 'Открыть QR'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-light btn-sm"
                                                        onClick={() => void handleDownloadConfig(config)}
                                                        disabled={activeDownloadId === config.id}
                                                    >
                                                        {activeDownloadId === config.id ? 'Скачиваем...' : 'Скачать файл'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-light btn-sm"
                                                        onClick={() => toggleConfig(config.id)}
                                                    >
                                                        {expandedConfigIds.includes(config.id) ? 'Свернуть текст' : 'Показать текст'}
                                                    </button>
                                                </div>

                                                {expandedConfigIds.includes(config.id) ? (
                                                    <pre className="config-output mb-0 mt-3">{config.config}</pre>
                                                ) : null}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="panel-card-section panel-card-section-divider pt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    disabled={isSaving}
                                    onClick={() => setIsDeleteModalOpen(true)}
                                >
                                    Удалить устройство
                                </button>
                            </div>
                        </section>

                        {isDeleteModalOpen ? (
                            <div
                                className="app-modal-backdrop"
                                role="presentation"
                                onClick={() => !isSaving && setIsDeleteModalOpen(false)}
                            >
                                <div
                                    className="app-modal panel-card"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="delete-device-modal-title"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                        <div>
                                            <p className="eyebrow mb-2">Подтверждение</p>
                                            <h2 id="delete-device-modal-title" className="panel-title mb-1">
                                                Удалить устройство?
                                            </h2>
                                            <p className="panel-subtitle mb-0">
                                                Устройство <strong>{selectedDevice.name}</strong> будет удалено из
                                                вашего списка вместе со связанными конфигурациями.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="app-modal-actions">
                                        <button
                                            type="button"
                                            className="btn btn-outline-light"
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            disabled={isSaving}
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            disabled={isSaving}
                                            onClick={() => void handleDeleteDevice(selectedDevice.id)}
                                        >
                                            {isSaving ? 'Удаляем...' : 'Да, удалить'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {qrConfig && qrImageUrl ? (
                            <div
                                className="app-modal-backdrop"
                                role="presentation"
                                onClick={() => closeQrModal()}
                            >
                                <div
                                    className="app-modal panel-card qr-modal"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="config-qr-modal-title"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                        <div>
                                            <p className="eyebrow mb-2">QR code</p>
                                            <h2 id="config-qr-modal-title" className="panel-title mb-1">
                                                {qrConfig.serverName}
                                            </h2>
                                            <p className="panel-subtitle mb-0">
                                                {qrConfig.serverLocation} · config #{qrConfig.id}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-outline-light btn-sm"
                                            onClick={() => closeQrModal()}
                                        >
                                            Закрыть
                                        </button>
                                    </div>

                                    <div className="qr-modal-image-wrap">
                                        <img src={qrImageUrl} alt={`QR код для конфигурации ${qrConfig.id}`} className="qr-modal-image"/>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <section className="panel-card">
                        <EmptyState
                            title="Устройство не выбрано"
                            description="Выберите существующее устройство слева или создайте новое."
                        />
                    </section>
                )}

                {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}
            </div>
        </div>
    )
}
