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

  return (
    <div
      onClick={() => onClick(product)}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform bg-white"
      style={{ minWidth: '176px' }}
    >
      {/* Цветная шапка карточки с иконкой */}
      <div className={`bg-gradient-to-br ${config.color} p-4 flex items-center justify-between`}>
        <span className="text-2xl">{config.icon}</span>
        <span className="text-white text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
          {product.type === 'card' ? 'Карта' :
           product.type === 'credit' ? 'Кредит' :
           product.type === 'deposit' ? 'Вклад' :
           product.type === 'mortgage' ? 'Ипотека' : 'Страховка'}
        </span>
      </div>

      {/* Тело карточки */}
      <div className="p-3">
        <h3 className="text-gray-800 font-semibold text-sm leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>

        {/* Ключевая выгода — самая важная информация */}
        <p className="text-blue-600 font-bold text-sm mb-3">
          {formatBenefit(product)}
        </p>

        {/* CTA-кнопка */}
        <button className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors">
          {config.ctaText}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
