// Главный экран-витрина продуктов (Showcase).
// Ключевой компонент приложения, реализующий концепцию «витрины по сценариям».
//
// Бизнес-решение: вместо стандартного списка продуктов (кредиты, карты, вклады)
// пользователь видит горизонтальные секции, сгруппированные по жизненным ситуациям:
// «Путешествия», «Дом», «Ежедневное». Это снижает когнитивную нагрузку
// и повышает вовлечённость (пользователь видит релевантные продукты, а не весь каталог).
import React, { useState, useEffect, useCallback } from 'react';
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
    color: 'from-yellow-400 to-orange-500',
    benefit: 'Эксклюзивные условия для Премиум-клиентов',
  },
  vip: {
    label: 'VIP',
    color: 'from-purple-500 to-purple-700',
    benefit: 'Персональный менеджер и привилегированные ставки',
  },
  mass: {
    label: 'Стандарт',
    color: 'from-blue-500 to-blue-700',
    benefit: 'Лучшие предложения для вас',
  },
};

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

type Tab = 'home' | 'analytics';

const ShowcaseComponent: React.FC<ShowcaseComponentProps> = ({ auth, onLogout }) => {
  const [showcase, setShowcase] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');

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

  const segment = auth.segment || 'mass';
  const segCfg = segmentConfig[segment] || segmentConfig.mass;

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
          className="px-6 py-3 text-white rounded-xl font-medium"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 theme-transition"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Шапка ───────────────────────────────────────────── */}
      <div
        className="px-5 pt-12 pb-6 theme-transition"
        style={{ background: `linear-gradient(135deg, var(--color-header-from), var(--color-header-to))` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Добро пожаловать</p>
            <h1 className="text-white text-xl font-bold">{auth.userName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Переключатель тем */}
            <ThemeSwitcher />
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {segCfg.label}
            </span>
            <button
              onClick={handleLogout}
              className="transition-colors p-1"
              style={{ color: 'rgba(255,255,255,0.7)' }}
              title="Выйти"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Баланс-заглушка с мини-графиком */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Основной счёт</p>
          <p className="text-white text-2xl font-bold">82 450 ₽</p>
          <p className="text-xs mt-1 mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>**** 4521 · Обновлено сейчас</p>
          {/* Sparkline баланса */}
          <SparklineChart />
        </div>
      </div>

      {/* ── Контент по вкладкам ───────────────────────────── */}
      {activeTab === 'home' && (
        <>
          {/* ── Блок "Рекомендуем именно вам" ───────────────────── */}
          <div className="px-4 mt-4">
            <div className={`bg-gradient-to-r ${segCfg.color} rounded-2xl p-4 text-white flex items-center gap-3 shadow-sm`}>
              <span className="text-3xl">🎯</span>
              <div>
                <p className="font-semibold text-sm">Рекомендуем именно вам</p>
                <p className="text-white/80 text-xs mt-0.5">{segCfg.benefit}</p>
              </div>
            </div>
          </div>

          {/* ── Дефолтный баннер ── */}
          {showcase?.is_default && (
            <div
              className="mx-4 mt-3 rounded-xl p-3 flex items-center gap-2 border"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                borderColor: 'var(--color-border)',
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
                      <button
                        className="text-xs font-medium hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        Все →
                      </button>
                    </div>

                    {/* Горизонтальная лента продуктов — вместо скучной сетки иконок */}
                    <div className="products-scroll">
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

      {/* ── Вкладка аналитики ─────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="px-4 mt-4 space-y-4 animate-fade-in">
          <h2
            className="font-bold text-lg theme-transition"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Аналитика расходов
          </h2>
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

      {/* ── Нижняя навигация ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around py-3 z-40 theme-transition"
        style={{
          backgroundColor: 'var(--color-nav-bg)',
          borderTop: '1px solid var(--color-nav-border)',
        }}
      >
        {[
          { id: 'home' as Tab,      icon: '🏠', label: 'Главная',  available: true },
          { id: 'products' as Tab,  icon: '💳', label: 'Продукты', available: false },
          { id: 'analytics' as Tab, icon: '📊', label: 'Аналитика', available: true },
          { id: 'profile' as Tab,   icon: '👤', label: 'Профиль',  available: false },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.available) {
                  setActiveTab(item.id as Tab);
                }
              }}
              className="flex flex-col items-center gap-0.5 px-3 transition-colors"
              style={{
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                opacity: item.available ? 1 : 0.5,
              }}
              title={item.available ? undefined : 'Скоро'}
              aria-disabled={!item.available}
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
