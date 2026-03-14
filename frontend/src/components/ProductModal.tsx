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
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      onClick={onClose}
    >
      {/* Само модальное окно — клик по нему не закрывает */}
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Хэндл для свайпа вниз */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

        {/* Тип продукта */}
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {typeLabel[product.type] || product.type}
        </span>

        {/* Название */}
        <h2 className="text-gray-900 text-xl font-bold mt-3 mb-2 leading-tight">
          {product.name}
        </h2>

        {/* Описание */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          {product.description}
        </p>

        {/* Ключевые параметры */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {product.interest_rate > 0 && (
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-green-800 font-bold text-lg">
                {product.interest_rate}%
              </div>
              <div className="text-green-600 text-xs">
                {product.type === 'deposit' ? 'годовых (ставка)' : 'годовых (ставка от)'}
              </div>
            </div>
          )}
          {product.min_amount > 0 && (
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-blue-800 font-bold text-sm">
                {formatCurrency(product.min_amount)}
              </div>
              <div className="text-blue-600 text-xs">минимальная сумма</div>
            </div>
          )}
          {product.interest_rate === 0 && product.min_amount === 0 && (
            <div className="col-span-2 bg-purple-50 rounded-xl p-3">
              <div className="text-purple-800 font-bold">Бесплатно</div>
              <div className="text-purple-600 text-xs">без скрытых комиссий</div>
            </div>
          )}
        </div>

        {/* Дисклеймер */}
        <p className="text-gray-400 text-xs mb-6">
          * Условия носят информационный характер. Финальные условия определяются
          индивидуально после подачи заявки.
        </p>

        {/* Главная кнопка конверсии */}
        <button
          onClick={() => onApply(product)}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl text-base hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
        >
          Оформить
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 text-gray-500 text-sm mt-3 hover:text-gray-700"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default ProductModal;
