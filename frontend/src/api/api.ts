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

// ─── Mock-данные витрины (для работы без бэкенда) ────────────
const MOCK_SHOWCASE: ShowcaseResponse = {
  user_id: 1,
  user_name: localStorage.getItem('user_name') || 'Пользователь',
  segment: localStorage.getItem('user_segment') || 'mass',
  is_default: false,
  blocks: [
    {
      scenario_id: 1,
      scenario_name: 'Путешествия',
      description: 'Карты и страховки для поездок',
      icon: 'plane',
      products: [
        { id: 1, name: 'Карта «Путешественник»', type: 'card', description: 'Кэшбэк 5% на авиабилеты и отели', interest_rate: 0, min_amount: 0 },
        { id: 2, name: 'Страховка для путешественников', type: 'insurance', description: 'Медицинское покрытие до €100 000', interest_rate: 0, min_amount: 2500 },
        { id: 3, name: 'Кредит на отпуск', type: 'credit', description: 'До 500 000 ₽ на мечту о путешествии', interest_rate: 9.9, min_amount: 50000 },
      ],
    },
    {
      scenario_id: 2,
      scenario_name: 'Дом и ипотека',
      description: 'Продукты для покупки и обустройства жилья',
      icon: 'home',
      products: [
        { id: 4, name: 'Ипотека «Семейная»', type: 'mortgage', description: 'Льготная ставка для семей с детьми', interest_rate: 6.0, min_amount: 1000000 },
        { id: 5, name: 'Кредит на ремонт', type: 'credit', description: 'До 1 500 000 ₽ на обустройство дома', interest_rate: 11.5, min_amount: 100000 },
        { id: 6, name: 'Страховка жилья', type: 'insurance', description: 'Полная защита квартиры и имущества', interest_rate: 0, min_amount: 5000 },
      ],
    },
    {
      scenario_id: 3,
      scenario_name: 'Образование',
      description: 'Инвестируйте в знания',
      icon: 'education',
      products: [
        { id: 7, name: 'Вклад «Образовательный»', type: 'deposit', description: 'Накопите на обучение ребёнка', interest_rate: 14.5, min_amount: 10000 },
        { id: 8, name: 'Образовательный кредит', type: 'credit', description: 'Льготные условия для студентов', interest_rate: 7.5, min_amount: 30000 },
      ],
    },
    {
      scenario_id: 4,
      scenario_name: 'Ежедневные расходы',
      description: 'Кэшбэк и бонусы на каждый день',
      icon: 'wallet',
      products: [
        { id: 9, name: 'Карта «Cashback»', type: 'card', description: '3% кэшбэк на все покупки', interest_rate: 0, min_amount: 0 },
        { id: 10, name: 'Вклад «Копилка»', type: 'deposit', description: 'Ежемесячные начисления на остаток', interest_rate: 12.0, min_amount: 1000 },
      ],
    },
  ],
};

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
 * При недоступности бэкенда возвращает mock-данные для демо.
 */
export const getShowcase = async (): Promise<ShowcaseResponse> => {
  try {
    const { data } = await apiClient.get<ShowcaseResponse>('/api/v1/showcase');
    return data;
  } catch {
    // Fallback: используем mock-данные для демо без бэкенда
    console.info('[Showcase] Бэкенд недоступен — используем mock-данные');
    return {
      ...MOCK_SHOWCASE,
      user_name: localStorage.getItem('user_name') || 'Пользователь',
      segment: localStorage.getItem('user_segment') || 'mass',
    };
  }
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
