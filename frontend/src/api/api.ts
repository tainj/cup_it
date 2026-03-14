// API-клиент на базе Axios.
// Централизованная настройка: baseURL, интерсепторы для JWT-заголовка,
// обработка ошибок авторизации (401 → редирект на логин).
import axios from 'axios';
import type { AnalyticsEvent, LoginResponse, ShowcaseResponse } from '../types/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Создаём экземпляр Axios с базовым URL
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Интерсептор запросов: автоматически добавляем JWT-токен из localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерсептор ответов: при 401 очищаем токен (сессия истекла)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // В реальном приложении — редирект на страницу входа
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// ─── API-функции ─────────────────────────────────────────────

/**
 * Авторизация: получаем JWT по user_id (mock для демо).
 * В реальном банке здесь был бы OAuth2 + 2FA.
 */
export const login = async (userId: number): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { user_id: userId });
  return data;
};

/**
 * Загрузка витрины: персонализированные блоки по сценариям пользователя.
 * Ключевой эндпоинт — возвращает структуру для главного экрана.
 */
export const getShowcase = async (): Promise<ShowcaseResponse> => {
  const { data } = await apiClient.get<ShowcaseResponse>('/api/v1/showcase');
  return data;
};

/**
 * Трекинг события аналитики.
 * Каждый клик и просмотр продукта записывается для расчёта CTR и CR.
 */
export const trackEvent = async (event: AnalyticsEvent): Promise<void> => {
  await apiClient.post('/api/v1/analytics/event', event);
};

/**
 * Получение агрегированных метрик (для бизнес-дашборда).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAdminMetrics = async (): Promise<any> => {
  const { data } = await apiClient.get('/api/v1/admin/metrics');
  return data;
};

/**
 * Список тестовых пользователей (для демо-входа).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUsers = async (): Promise<any[]> => {
  const { data } = await apiClient.get('/api/users');
  return data.users || [];
};
