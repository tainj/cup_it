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

const ShowcaseComponent: React.FC<ShowcaseComponentProps> = ({ auth, onLogout }) => {
  const [showcase, setShowcase] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  // ─── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Загружаем вашу витрину...</p>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 gap-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-gray-700 text-center">{error}</p>
        <button
          onClick={loadShowcase}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Шапка ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-xs">Добро пожаловать</p>
            <h1 className="text-white text-xl font-bold">{auth.userName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-gradient-to-r ${segCfg.color} text-white`}>
              {segCfg.label}
            </span>
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-white transition-colors p-1"
              title="Выйти"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Баланс-заглушка для реалистичности */}
        <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-blue-200 text-xs mb-1">Основной счёт</p>
          <p className="text-white text-2xl font-bold">82 450 ₽</p>
          <p className="text-blue-200 text-xs mt-1">**** 4521 · Обновлено сейчас</p>
        </div>
      </div>

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

      {/* ── Дефолтный баннер (если нет персональных сценариев) ── */}
      {showcase?.is_default && (
        <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <p className="text-blue-700 text-xs">
            Показываем популярные продукты. Витрина персонализируется по мере использования.
          </p>
        </div>
      )}

      {/* ── Сценарии-секции (основная часть витрины) ────────── */}
      <div className="mt-5 space-y-6">
        {showcase?.blocks?.map((block, blockIdx) => (
          <div key={block.scenario_id} className="animate-fade-in" style={{ animationDelay: `${blockIdx * 80}ms` }}>
            {/* Заголовок секции */}
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{scenarioIcons[block.icon] || '⭐'}</span>
                <div>
                  <h2 className="text-gray-900 font-semibold text-base leading-tight">
                    {block.scenario_name}
                  </h2>
                  {block.description && (
                    <p className="text-gray-400 text-xs leading-tight">{block.description}</p>
                  )}
                </div>
              </div>
              <button className="text-blue-600 text-xs font-medium hover:underline">
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
        ))}
      </div>

      {/* ── Нижняя навигация ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 z-40">
        {[
          { icon: '🏠', label: 'Главная', active: true },
          { icon: '💳', label: 'Продукты', active: false },
          { icon: '📊', label: 'Аналитика', active: false },
          { icon: '👤', label: 'Профиль', active: false },
        ].map((item) => (
          <button key={item.label} className={`flex flex-col items-center gap-0.5 px-3 ${item.active ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
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
