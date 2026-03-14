// Карточка банковского продукта для горизонтальной ленты витрины.
// Дизайн фокусируется на ключевой выгоде (CTA) и быстрой читаемости,
// чтобы пользователь мог принять решение за 2-3 секунды.
import React from 'react';
import type { Product } from '../types/types';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

// Цвета и иконки по типу продукта
const typeConfig: Record<string, { color: string; icon: string; ctaText: string }> = {
  card: {
    color: 'from-purple-500 to-purple-700',
    icon: '💳',
    ctaText: 'Оформить карту',
  },
  credit: {
    color: 'from-orange-500 to-red-600',
    icon: '💰',
    ctaText: 'Получить кредит',
  },
  deposit: {
    color: 'from-green-500 to-emerald-700',
    icon: '📈',
    ctaText: 'Открыть вклад',
  },
  mortgage: {
    color: 'from-blue-500 to-blue-700',
    icon: '🏠',
    ctaText: 'Узнать условия',
  },
  insurance: {
    color: 'from-teal-500 to-teal-700',
    icon: '🛡️',
    ctaText: 'Застраховаться',
  },
};

const defaultConfig = { color: 'from-gray-500 to-gray-700', icon: '📦', ctaText: 'Подробнее' };

// Форматирование ставки / суммы для отображения ключевой выгоды
const formatBenefit = (product: Product): string => {
  if (product.type === 'deposit' && product.interest_rate > 0) {
    return `До ${product.interest_rate}% годовых`;
  }
  if ((product.type === 'credit' || product.type === 'mortgage') && product.interest_rate > 0) {
    return `От ${product.interest_rate}% годовых`;
  }
  if (product.min_amount > 0) {
    const formatted = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(product.min_amount);
    return `От ${formatted}`;
  }
  return 'Бесплатно';
};

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const config = typeConfig[product.type] || defaultConfig;

  const typeLabel =
    product.type === 'card' ? 'Карта' :
    product.type === 'credit' ? 'Кредит' :
    product.type === 'deposit' ? 'Вклад' :
    product.type === 'mortgage' ? 'Ипотека' : 'Страховка';

  return (
    <div
      onClick={() => onClick(product)}
      className="product-card flex-shrink-0 w-44 overflow-hidden cursor-pointer select-none theme-transition"
      style={{
        minWidth: '176px',
        borderRadius: '16px',
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px) scale(1.02)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* Цветная шапка карточки с иконкой */}
      <div className={`bg-gradient-to-br ${config.color} p-4 flex items-center justify-between`}>
        <span className="text-2xl">{config.icon}</span>
        <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Тело карточки */}
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 theme-transition"
            style={{ color: 'var(--color-text-primary)' }}>
          {product.name}
        </h3>

        {/* Ключевая выгода — самая важная информация */}
        <p className="font-bold text-sm mb-3" style={{ color: 'var(--color-accent)' }}>
          {formatBenefit(product)}
        </p>

        {/* CTA-кнопки: Оформить + Подробнее */}
        <div className="flex gap-1.5">
          <button
            className="flex-1 py-1.5 text-white text-xs font-semibold rounded-xl transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'var(--color-accent)', borderRadius: '10px' }}
            onClick={(e) => { e.stopPropagation(); onClick(product); }}
          >
            Оформить
          </button>
          <button
            className="px-2 py-1.5 text-xs font-medium rounded-xl border transition-opacity hover:opacity-80"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-alt)',
              borderRadius: '10px',
            }}
            aria-label="Подробнее"
            onClick={(e) => { e.stopPropagation(); onClick(product); }}
          >
            ···
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
