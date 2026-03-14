// Мини-график (sparkline) баланса для главного экрана.
// Показывает динамику за последние 7 дней без осей и подписей.
import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// Mock-данные: динамика баланса за 7 дней
const mockBalance = [
  { day: 'Пн', balance: 79200 },
  { day: 'Вт', balance: 77800 },
  { day: 'Ср', balance: 81500 },
  { day: 'Чт', balance: 80100 },
  { day: 'Пт', balance: 83200 },
  { day: 'Сб', balance: 81900 },
  { day: 'Вс', balance: 82450 },
];

const SparklineChart: React.FC = () => {
  const { theme } = useTheme();
  const color = theme === 'otp' ? '#ff6b35' : '#60a5fa';

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={mockBalance} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            fontSize: 11,
            padding: '4px 8px',
          }}
          labelStyle={{ display: 'none' }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={color}
          strokeWidth={2}
          fill="url(#sparkGrad)"
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SparklineChart;
