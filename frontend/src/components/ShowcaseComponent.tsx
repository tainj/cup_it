// Главный экран-витрина продуктов (Showcase).
// Ключевой компонент приложения, реализующий концепцию «витрины по сценариям».
//
// Бизнес-решение: вместо стандартного списка продуктов (кредиты, карты, вклады)
// пользователь видит горизонтальные секции, сгруппированные по жизненным ситуациям:
// «Путешествия», «Дом», «Ежедневное». Это снижает когнитивную нагрузку
// и повышает вовлечённость (пользователь видит релевантные продукты, а не весь каталог).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getShowcase, trackEvent } from '../api/api';
import type { AuthState, Product, ShowcaseResponse } from '../types/types';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import Toast from './Toast';
import ThemeSwitcher from './ThemeSwitcher';
import IncomeExpenseChart from './charts/IncomeExpenseChart';
import CategoryPieChart from './charts/CategoryPieChart';
import SparklineChart from './charts/SparklineChart';

interface ShowcaseComponentProps {
  auth: AuthState;
  onLogout: () => void;
}

// Иконки для сценариев (маппинг из БД на эмодзи)
const scenarioIcons: Record<string, string> = {
  plane: '✈️',
  home: '🏠',
  wallet: '💳',
  'piggy-bank': '🐷',
  car: '🚗',
  star: '⭐',
  education: '🎓',
  travel: '✈️',
};

// Плашки сегментов клиентов для блока "Рекомендуем вам"
const segmentConfig: Record<string, { label: string; color: string; benefit: string }> = {
  premium: {
    label: 'Премиум',
    color: 'from-amber-400 to-orange-500',
    benefit: 'Эксклюзивные условия для Премиум-клиентов',
  },
  vip: {
    label: 'VIP',
    color: 'from-slate-700 to-amber-600',
    benefit: 'Персональный менеджер и привилегированные ставки',
  },
  mass: {
    label: 'Стандарт',
    color: 'from-cyan-500 to-blue-700',
    benefit: 'Лучшие предложения для вас',
  },
};

const recentTransactions = [
  { id: 1, title: 'Супермаркет Green', subtitle: 'Покупки · Сегодня, 14:20', amount: -2840, icon: '🛒' },
  { id: 2, title: 'Зарплатное зачисление', subtitle: 'Доход · Сегодня, 09:10', amount: 108000, icon: '💼' },
  { id: 3, title: 'Подписка на сервис', subtitle: 'Онлайн · Вчера, 21:04', amount: -599, icon: '🎧' },
  { id: 4, title: 'Такси', subtitle: 'Транспорт · Вчера, 18:42', amount: -740, icon: '🚕' },
  { id: 5, title: 'Кэшбэк OTP', subtitle: 'Бонус · 12 марта', amount: 1260, icon: '✨' },
];

const profileSections = [
  { id: 'limits', title: 'Лимиты и безопасность', description: 'Изменить лимиты, включить подтверждения, настроить вход', icon: '🛡️' },
  { id: 'support', title: 'Поддержка 24/7', description: 'Чат с банком, звонок, быстрые ответы по продуктам', icon: '💬' },
  { id: 'docs', title: 'Документы и справки', description: 'Выписки, реквизиты, шаблоны платежей и справки', icon: '📄' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);

const formatSignedAmount = (amount: number) => `${amount > 0 ? '+' : '−'}${formatCurrency(Math.abs(amount))}`;

// Компонент заглушки (skeleton) для карточки продукта
const ProductCardSkeleton: React.FC = () => (
  <div
    className="flex-shrink-0 w-44"
    style={{ minWidth: '176px', borderRadius: '16px', overflow: 'hidden' }}
  >
    <div className="skeleton" style={{ height: '72px' }} />
    <div className="p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
      <div className="skeleton mb-2" style={{ height: '14px', width: '80%' }} />
      <div className="skeleton mb-3" style={{ height: '14px', width: '55%' }} />
      <div className="skeleton" style={{ height: '28px' }} />
    </div>
  </div>
);

// Skeleton для секции сценария
const ScenarioSkeleton: React.FC = () => (
  <div className="animate-fade-in">
    <div className="flex items-center gap-2 px-4 mb-3">
      <div className="skeleton w-8 h-8 rounded-full" />
      <div>
        <div className="skeleton mb-1" style={{ height: '14px', width: '120px' }} />
        <div className="skeleton" style={{ height: '11px', width: '80px' }} />
      </div>
    </div>
    <div className="products-scroll">
      {[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
    </div>
  </div>
);

type Tab = 'home' | 'history' | 'analytics' | 'profile';

const ShowcaseComponent: React.FC<ShowcaseComponentProps> = ({ auth, onLogout }) => {
  const [showcase, setShowcase] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [cardVisible, setCardVisible] = useState(false);
  const scrollerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadShowcase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShowcase();
      setShowcase(data);
      // Трекинг: пользователь открыл витрину
      await sendEvent('view', undefined, 'Витрина открыта — событие view отправлено');
    } catch {
      setError('Не удалось загрузить витрину. Проверьте соединение.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Загружаем витрину при монтировании
  useEffect(() => {
    loadShowcase();
  }, [loadShowcase]);

  // Отправляем аналитическое событие и показываем тост
  const sendEvent = useCallback(async (
    eventType: 'view' | 'click' | 'apply' | 'purchase',
    productId?: number,
    toastMsg?: string
  ) => {
    try {
      await trackEvent({ event_type: eventType, product_id: productId });
      console.log(`[Analytics] Событие: ${eventType}`, productId ? `| product_id: ${productId}` : '');
      if (toastMsg) setToast(toastMsg);
    } catch {
      console.warn('[Analytics] Не удалось отправить событие');
    }
  }, []);

  // Клик на карточку продукта
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    sendEvent('click', product.id, `📊 Клик: "${product.name}" — событие click отправлено`);
  };

  // Нажатие "Оформить" в модальном окне
  const handleApply = (product: Product) => {
    sendEvent('apply', product.id, `✅ Заявка: "${product.name}" — событие apply отправлено`);
    setSelectedProduct(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    onLogout();
  };

  const scrollScenario = (scenarioId: number, direction: 'left' | 'right') => {
    const node = scrollerRefs.current[scenarioId];
    if (!node) return;
    node.scrollBy({ left: direction === 'right' ? 240 : -240, behavior: 'smooth' });
  };

  const segment = auth.segment || 'mass';
  const segCfg = segmentConfig[segment] || segmentConfig.mass;
  const blocks = showcase?.blocks ?? [];
  const totalProducts = blocks.reduce((count, block) => count + (block.products?.length ?? 0), 0);
  const featuredScenario = blocks[0]?.scenario_name ?? 'Подборка';
  const conversionLabel = segment === 'vip' ? 'Приоритет' : segment === 'premium' ? 'Высокий фокус' : 'Готово к подбору';
  const accountNumber = cardVisible ? '2200 1234 5678 4521' : '2200 •••• •••• 4521';
  const weeklyTrend = 3250;
  const quickActions: Array<{ label: string; icon: string; tab: Tab }> = [
    { label: 'История', icon: '🕘', tab: 'history' },
    { label: 'Аналитика', icon: '📊', tab: 'analytics' },
    { label: 'Профиль', icon: '👤', tab: 'profile' },
  ];

  // ─── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 theme-transition"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <span className="text-5xl">⚠️</span>
        <p className="text-center" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        <button
          onClick={loadShowcase}
          className="px-6 py-3 primary-btn"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 theme-transition relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Шапка ───────────────────────────────────────────── */}
      <div
        className="px-5 pt-12 pb-6 theme-transition relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--color-header-from), var(--color-header-to))` }}
      >
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full"
          style={{ background: 'rgba(255,255,255,0.16)', filter: 'blur(2px)' }}
        />
        <div
          className="absolute -bottom-10 -left-8 w-36 h-36 rounded-full"
          style={{ background: 'rgba(255,255,255,0.11)', filter: 'blur(2px)' }}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Добро пожаловать</p>
            <h1 className="text-white text-xl font-bold">{auth.userName}</h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>ID клиента · {auth.userId}</p>
          </div>
          <div className="header-actions">
            {/* Переключатель тем */}
            <ThemeSwitcher />
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full text-white whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {segCfg.label}
            </span>
            <button
              onClick={handleLogout}
              className="header-logout-btn"
              style={{ color: '#ffffff' }}
              title="Выйти"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Выход</span>
            </button>
          </div>
        </div>

        {/* Баланс-заглушка с мини-графиком */}
        <div
          className="rounded-2xl p-4 glass-card account-card"
          style={{
            backgroundColor: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.26)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.72)' }}>Основной счёт</p>
              <p className="text-white text-3xl font-bold">82 450 ₽</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.76)' }}>
                Рост за неделю: <strong className="text-white">+{formatCurrency(weeklyTrend)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCardVisible((value) => !value)}
              className="header-icon-btn"
              title={cardVisible ? 'Скрыть номер карты' : 'Показать номер карты'}
            >
              {cardVisible ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3l18 18M10.584 10.587A2 2 0 0012 14a2 2 0 001.414-.586m2.096-2.097A9.956 9.956 0 0112 12c-1.536 0-2.99-.346-4.292-.963m8.584 0A9.956 9.956 0 0021 12c-1.73-3.61-5.122-6-9-6a9.955 9.955 0 00-4.222.93M6.228 6.228A9.956 9.956 0 003 12c.869 1.815 2.307 3.343 4.097 4.405" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="account-number-row">
            <div>
              <p className="account-number-label">Номер карты</p>
              <p className="account-number-value">{accountNumber}</p>
            </div>
            <div className="text-right">
              <p className="account-number-label">Статус</p>
              <p className="account-number-value text-sm">Digital Visa</p>
            </div>
          </div>
          <div className="account-mini-stats">
            <div>
              <span>Платежи</span>
              <strong>17</strong>
            </div>
            <div>
              <span>Кэшбэк</span>
              <strong>1 260 ₽</strong>
            </div>
            <div>
              <span>Лимит дня</span>
              <strong>150 000 ₽</strong>
            </div>
          </div>
          {/* Sparkline баланса */}
          <SparklineChart />
        </div>
      </div>

      {/* ── Контент по вкладкам ───────────────────────────── */}
      {activeTab === 'home' && (
        <>
          {/* ── Блок "Рекомендуем именно вам" ───────────────────── */}
          <div className="px-4 mt-4">
            <div className={`segment-banner bg-gradient-to-r ${segCfg.color} p-4 text-white flex items-center gap-3`}>
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-semibold text-sm">Рекомендуем именно вам</p>
                <p className="text-white/80 text-xs mt-0.5">{segCfg.benefit}</p>
              </div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <div className="metrics-grid">
              <div className="metric-card theme-transition">
                <span>Сценарии</span>
                <strong>{loading ? '...' : blocks.length}</strong>
              </div>
              <div className="metric-card theme-transition">
                <span>Предложения</span>
                <strong>{loading ? '...' : totalProducts}</strong>
              </div>
              <div className="metric-card theme-transition">
                <span>Тон витрины</span>
                <strong>{conversionLabel}</strong>
              </div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <div className="quick-actions-grid">
              {quickActions.map((action) => (
                <button
                  key={action.tab}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  className="quick-action-btn"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Дефолтный баннер ── */}
          {showcase?.is_default && (
            <div
              className="mx-4 mt-3 rounded-xl p-3 flex items-center gap-2 border surface-card"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                borderColor: 'var(--color-border)',
                boxShadow: 'none',
              }}
            >
              <span className="text-lg">💡</span>
              <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                Показываем популярные продукты. Витрина персонализируется по мере использования.
              </p>
            </div>
          )}

          {/* ── Сценарии-секции (основная часть витрины) ────────── */}
          <div className="mt-5 space-y-6">
            {loading
              ? [1, 2, 3].map((i) => <ScenarioSkeleton key={i} />)
              : showcase?.blocks?.map((block, blockIdx) => (
                  <div
                    key={block.scenario_id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${blockIdx * 80}ms` }}
                  >
                    {/* Заголовок секции */}
                    <div className="flex items-center justify-between px-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{scenarioIcons[block.icon] || '⭐'}</span>
                        <div>
                          <span className="section-label mb-2">
                            {blockIdx === 0 ? 'Featured flow' : `Подборка ${blockIdx + 1}`}
                          </span>
                          <h2
                            className="font-semibold text-base leading-tight theme-transition"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {block.scenario_name}
                          </h2>
                          {block.description && (
                            <p
                              className="text-xs leading-tight theme-transition"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {block.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="scenario-controls">
                        <span className="desktop-scroll-hint">Листайте кнопками</span>
                        <button
                          type="button"
                          className="scroll-btn"
                          onClick={() => scrollScenario(block.scenario_id, 'left')}
                          aria-label={`Прокрутить ${block.scenario_name} влево`}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          className="scroll-btn"
                          onClick={() => scrollScenario(block.scenario_id, 'right')}
                          aria-label={`Прокрутить ${block.scenario_name} вправо`}
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {/* Горизонтальная лента продуктов — вместо скучной сетки иконок */}
                    <div
                      ref={(node) => { scrollerRefs.current[block.scenario_id] = node; }}
                      className="products-scroll"
                    >
                      {block.products?.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onClick={handleProductClick}
                        />
                      ))}
                    </div>
                  </div>
                ))
            }
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="px-4 mt-4 space-y-4 animate-fade-in">
          <div className="surface-card p-4">
            <span className="section-label">Recent activity</span>
            <h2 className="font-bold text-lg mt-3 theme-transition" style={{ color: 'var(--color-text-primary)' }}>
              История операций
            </h2>
            <p className="text-sm mt-2 theme-transition" style={{ color: 'var(--color-text-muted)' }}>
              Последние движения по счёту и быстрый обзор того, куда уходят деньги.
            </p>
          </div>

          <div className="history-list">
            {recentTransactions.map((item) => (
              <div key={item.id} className="history-item theme-transition">
                <div className="history-icon">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold theme-transition" style={{ color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </p>
                  <p className="text-xs theme-transition" style={{ color: 'var(--color-text-muted)' }}>
                    {item.subtitle}
                  </p>
                </div>
                <div
                  className="history-amount"
                  style={{ color: item.amount > 0 ? '#16a34a' : 'var(--color-text-primary)' }}
                >
                  {formatSignedAmount(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Вкладка аналитики ─────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="px-4 mt-4 space-y-4 animate-fade-in">
          <div className="analytics-hero">
            <span className="section-label" style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>
              Finance pulse
            </span>
            <h2 className="font-bold text-xl mt-3">Аналитика расходов</h2>
            <p className="text-sm mt-2">Сводка по доходам, расходам и ключевым категориям в одном экране.</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-2xl px-3 py-2 bg-white/10">
                <span className="text-[11px]">Фокус</span>
                <strong className="block text-sm mt-1">{featuredScenario}</strong>
              </div>
              <div className="rounded-2xl px-3 py-2 bg-white/10">
                <span className="text-[11px]">Тренд</span>
                <strong className="block text-sm mt-1">+11%</strong>
              </div>
              <div className="rounded-2xl px-3 py-2 bg-white/10">
                <span className="text-[11px]">Ритм</span>
                <strong className="block text-sm mt-1">Стабильный</strong>
              </div>
            </div>
          </div>
          <IncomeExpenseChart />
          <CategoryPieChart />
          {/* Подсказка о mock-данных */}
          <p
            className="text-xs text-center pb-2 theme-transition"
            style={{ color: 'var(--color-text-muted)' }}
          >
            * Данные для демонстрации. В продакшне подключается API аналитики.
          </p>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="px-4 mt-4 space-y-4 animate-fade-in">
          <div className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="profile-avatar">{auth.userName?.[0] ?? 'U'}</div>
              <div>
                <h2 className="font-bold text-lg theme-transition" style={{ color: 'var(--color-text-primary)' }}>
                  {auth.userName}
                </h2>
                <p className="text-sm theme-transition" style={{ color: 'var(--color-text-muted)' }}>
                  Сегмент: {segCfg.label} · User ID {auth.userId}
                </p>
              </div>
            </div>
          </div>

          <div className="profile-stack">
            {profileSections.map((section) => (
              <div key={section.id} className="profile-row theme-transition">
                <div className="profile-row-icon">{section.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold theme-transition" style={{ color: 'var(--color-text-primary)' }}>
                    {section.title}
                  </p>
                  <p className="text-xs theme-transition" style={{ color: 'var(--color-text-muted)' }}>
                    {section.description}
                  </p>
                </div>
                <span className="theme-transition" style={{ color: 'var(--color-text-muted)' }}>→</span>
              </div>
            ))}
          </div>

          <button type="button" className="w-full py-4 primary-btn" onClick={handleLogout}>
            Выйти из профиля
          </button>
        </div>
      )}

      {/* ── Нижняя навигация ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around py-3 z-40 theme-transition nav-frosted"
        style={{
          backgroundColor: 'var(--color-nav-bg)',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
        }}
      >
        {[
          { id: 'home' as Tab, icon: '🏠', label: 'Главная' },
          { id: 'history' as Tab, icon: '🕘', label: 'История' },
          { id: 'analytics' as Tab, icon: '📊', label: 'Аналитика' },
          { id: 'profile' as Tab, icon: '👤', label: 'Профиль' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.id as Tab)}
              className="nav-tab-btn flex flex-col items-center gap-0.5 px-3 transition-colors"
              style={{
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Модальное окно продукта ───────────────────────────── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApply={handleApply}
        />
      )}

      {/* ── Toast уведомление (аналитика) ────────────────────── */}
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ShowcaseComponent;
