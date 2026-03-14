// Компонент графика доходов vs расходов за последние 6 месяцев.
// Использует Recharts BarChart с mock-данными.
// В продакшне данные приходят с бэкенда через /api/v1/analytics/...
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// Mock-данные: последние 6 месяцев
const mockData = [
  { month: 'Окт', income: 95000, expense: 67000 },
  { month: 'Ноя', income: 102000, expense: 72000 },
  { month: 'Дек', income: 110000, expense: 95000 },
  { month: 'Янв', income: 98000, expense: 64000 },
  { month: 'Фев', income: 104000, expense: 71000 },
  { month: 'Мар', income: 108000, expense: 76000 },
];

const formatK = (value: number) => `${(value / 1000).toFixed(0)}к`;

const IncomeExpenseChart: React.FC = () => {
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#94a3b8' : '#6b7280';
  const gridColor = theme === 'dark' ? '#334155' : '#f3f4f6';
  const incomeColor = theme === 'otp' ? '#ff6b35' : '#22c55e';
  const expenseColor = theme === 'dark' ? '#475569' : '#f87171';

  return (
    <div className="rounded-2xl p-4 theme-transition" style={{ backgroundColor: 'var(--color-surface)' }}>
      <h3 className="font-semibold text-sm mb-1 theme-transition" style={{ color: 'var(--color-text-primary)' }}>
        Доходы и расходы
      </h3>
      <p className="text-xs mb-4 theme-transition" style={{ color: 'var(--color-text-muted)' }}>
        Последние 6 месяцев
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={mockData} barCategoryGap="30%" barGap={4}>
          <CartesianGrid vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatK}
            tick={{ fontSize: 10, fill: textColor }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
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
            labelStyle={{ color: textColor }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 11, color: textColor }}>
                {value === 'income' ? 'Доходы' : 'Расходы'}
              </span>
            )}
          />
          <Bar dataKey="income" name="income" fill={incomeColor} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="expense" fill={expenseColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
