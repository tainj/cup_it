# OTP Bank — Витрина продуктов (MVP)

Мобильное банковское приложение (веб-версия) для кейс-чемпионата OTP Bank.
Концепция: **«Витрина по жизненным сценариям»** вместо стандартного каталога продуктов.

## Структура проекта

```
cup_it/
├── backend/                    # Go (Gin) сервер
│   ├── cmd/server/main.go      # Точка входа, инициализация зависимостей
│   ├── internal/
│   │   ├── config/             # Загрузка конфигурации (.env)
│   │   ├── models/             # GORM-модели (User, Product, Scenario, ...)
│   │   ├── handlers/           # HTTP-обработчики (Login, Showcase, Analytics)
│   │   ├── middleware/         # JWT-аутентификация
│   │   ├── repository/         # Слой доступа к данным (PostgreSQL)
│   │   └── usecase/            # Бизнес-логика витрины
│   ├── migrations/001_init.sql # SQL-схема и тестовые данные
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # React (TypeScript) + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx             # Корневой компонент, управление авторизацией
│   │   ├── components/
│   │   │   ├── LoginPage.tsx       # Страница входа
│   │   │   ├── ShowcaseComponent.tsx # Главная витрина по сценариям
│   │   │   ├── ProductCard.tsx     # Карточка продукта с CTA
│   │   │   ├── ProductModal.tsx    # Модальное окно с деталями
│   │   │   └── Toast.tsx           # Уведомления аналитики
│   │   ├── api/api.ts          # Axios API-клиент
│   │   └── types/types.ts      # TypeScript типы
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── .env.example
```

## Запуск с Docker Compose (рекомендуется)

```bash
# 1. Клонируйте репозиторий
git clone <repo-url> && cd cup_it

# 2. Создайте .env файл
cp .env.example .env

# 3. Запустите все сервисы
docker-compose up --build

# Приложение доступно:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

## Ручной запуск

### Backend (Go)

```bash
cd backend

# Установите зависимости
go mod tidy

# Создайте .env файл
cp .env.example .env
# Отредактируйте .env — укажите параметры PostgreSQL

# Применить SQL-миграции
psql -U postgres -d cup_it -f migrations/001_init.sql

# Запустите сервер
go run cmd/server/main.go
```

### Frontend (React)

```bash
cd frontend

# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env.local

# Запустите dev-сервер
npm run dev
# -> http://localhost:5173
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/login | Mock-авторизация, возвращает JWT |
| GET | /api/users | Список демо-пользователей |
| GET | /api/v1/showcase | Персонализированная витрина по сценариям |
| POST | /api/v1/analytics/event | Трекинг события (view/click/apply) |
| GET | /api/v1/admin/metrics | Бизнес-метрики (CTR, Conversion Rate) |

## Решаемые проблемы (Case Study)

### 1. Упрощение навигации
Продукты сгруппированы по жизненным сценариям (Путешествия, Дом, Ежедневное),
а не по банковским категориям.

### 2. Персонализация
Таблица user_scenarios хранит приоритет сценариев для каждого клиента.
Витрина каждого пользователя уникальна и отсортирована по его потребностям.

### 3. Измеримость бизнеса
Таблица analytics_events фиксирует каждое взаимодействие.
Эндпоинт /admin/metrics возвращает CTR и Conversion Rate по продуктам.

## Тестовые пользователи

| ID | Имя | Сегмент | Персональные сценарии |
|----|-----|---------|----------------------|
| 1 | Алексей Смирнов | Premium | Путешествия -> Накопления -> Ежедневное |
| 2 | Мария Иванова | Mass | Ежедневное -> Дом -> Накопления |
| 3 | Дмитрий Козлов | VIP | Дефолтные (нет персональных) |
