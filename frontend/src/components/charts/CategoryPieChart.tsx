// Компонент круговой диаграммы категорий расходов.
// Использует Recharts PieChart с mock-данными.
// Показывает топ-5 категорий трат пользователя.
import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// Mock-данные категорий расходов
const mockCategories = [
  { name: 'Продукты', value: 18500, icon: '🛒' },
  { name: 'Транспорт', value: 9200, icon: '🚌' },
  { name: 'Рестораны', value: 12400, icon: '🍽️' },
  { name: 'Развлечения', value: 7800, icon: '🎬' },
  { name: 'Прочее', value: 6100, icon: '📦' },
];

const LIGHT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];
const OTP_COLORS = ['#ff6b35', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'];
const DARK_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

const total = mockCategories.reduce((s, c) => s + c.value, 0);

const CategoryPieChart: React.FC = () => {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const colors = theme === 'dark' ? DARK_COLORS : theme === 'otp' ? OTP_COLORS : LIGHT_COLORS;

  return (
    <div className="rounded-2xl p-4 theme-transition" style={{ backgroundColor: 'var(--color-surface)' }}>
      <h3 className="font-semibold text-sm mb-1 theme-transition" style={{ color: 'var(--color-text-primary)' }}>
        Категории расходов
      </h3>
      <p className="text-xs mb-3 theme-transition" style={{ color: 'var(--color-text-muted)' }}>
        Март 2026
      </p>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={mockCategories}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {mockCategories.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0,
              }).format(Number(value))
            }
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Легенда */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {mockCategories.map((cat, index) => {
          const pct = ((cat.value / total) * 100).toFixed(1);
          return (
            <button
              key={cat.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: activeIndex === index ? colors[index] + '20' : 'transparent',
              }}
            >
              <span className="text-sm">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: colors[index] }}>
                  {cat.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {pct}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPieChart;

