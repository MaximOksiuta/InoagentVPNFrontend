# vpn-auto frontend

Фронтенд для контракта из [openapi.json](/Users/max/shit/vpn-auto/frontend/openapi.json) на `React + TypeScript + Bootstrap + Vite`.

## Архитектура

- `src/app` — корневые провайдеры, layout и роутинг
- `src/features/auth` — вход и регистрация по телефону и паролю
- `src/features/devices` — пользовательские девайсы и генерация конфигов
- `src/features/servers` — административное управление серверами
- `src/shared` — HTTP-клиент, типы контракта, storage и общие UI-блоки

## Запуск

1. Установить зависимости: `npm install`
2. Создать `.env` по примеру `.env.example`
3. Запустить дев-сервер: `npm run dev`

По умолчанию API ожидается на том же домене, что и фронтенд (`/api` через reverse proxy). Для локальной разработки можно задать `VITE_API_BASE_URL=http://localhost:8080`.
