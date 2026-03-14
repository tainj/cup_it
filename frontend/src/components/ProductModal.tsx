// Модальное окно с деталями продукта.
// Открывается при клике на карточку. Содержит полное описание,
// условия и главный CTA «Оформить» — точка конверсии.
import React, { useEffect } from 'react';
import type { Product } from '../types/types';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onApply: (product: Product) => void;
}

const typeLabel: Record<string, string> = {
  card: 'Банковская карта',
  credit: 'Потребительский кредит',
  deposit: 'Вклад / Инвестиции',
  mortgage: 'Ипотека',
  insurance: 'Страхование',
};

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onApply }) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    // Затемнённый фон — клик закрывает модалку
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end justify-center z-50"
      onClick={onClose}
    >
      {/* Само модальное окно — клик по нему не закрывает */}
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-8 animate-fade-in theme-transition"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -12px 32px rgba(5, 13, 27, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Хэндл для свайпа вниз */}
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* Тип продукта */}
        <span className="chip">
          {typeLabel[product.type] || product.type}
        </span>

        {/* Название */}
        <h2 className="text-xl font-bold mt-3 mb-2 leading-tight theme-transition" style={{ color: 'var(--color-text-primary)' }}>
          {product.name}
        </h2>

        {/* Описание */}
        <p className="text-sm leading-relaxed mb-6 theme-transition" style={{ color: 'var(--color-text-secondary)' }}>
          {product.description}
        </p>

        {/* Ключевые параметры */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {product.interest_rate > 0 && (
            <div
              className="rounded-xl p-3 theme-transition"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)',
              }}
            >
              <div className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                {product.interest_rate}%
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {product.type === 'deposit' ? 'годовых (ставка)' : 'годовых (ставка от)'}
              </div>
            </div>
          )}
          {product.min_amount > 0 && (
            <div
              className="rounded-xl p-3 theme-transition"
              style={{
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(product.min_amount)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>минимальная сумма</div>
            </div>
          )}
          {product.interest_rate === 0 && product.min_amount === 0 && (
            <div
              className="col-span-2 rounded-xl p-3 theme-transition"
              style={{
                backgroundColor: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Бесплатно</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>без скрытых комиссий</div>
            </div>
          )}
        </div>

        {/* Дисклеймер */}
        <p className="text-xs mb-6 theme-transition" style={{ color: 'var(--color-text-muted)' }}>
          * Условия носят информационный характер. Финальные условия определяются
          индивидуально после подачи заявки.
        </p>

        {/* Главная кнопка конверсии */}
        <button
          onClick={() => onApply(product)}
          className="w-full py-4 primary-btn text-base"
          style={{ borderRadius: '16px' }}
        >
          Оформить
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 text-sm mt-3 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default ProductModal;
