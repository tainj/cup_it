// Мини-график (sparkline) баланса для главного экрана.
// Показывает динамику за последние 7 дней без осей и подписей.
import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, ReferenceDot } from 'recharts';
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
  const color = theme === 'otp' ? '#ffd0bf' : theme === 'dark' ? '#8ad3ff' : '#d8ebff';
  const accentDot = theme === 'otp' ? '#ffffff' : '#c7e7ff';
  const axisColor = theme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.72)';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)';
  const latest = mockBalance[mockBalance.length - 1];

  return (
    <ResponsiveContainer width="100%" height={88}>
      <AreaChart data={mockBalance} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.45} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 4" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: axisColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={['dataMin - 1200', 'dataMax + 1200']} />
        <Tooltip
          labelFormatter={(label) => `${label}`}
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
          strokeWidth={2.5}
          fill="url(#sparkGrad)"
          dot={false}
          activeDot={{ r: 3, fill: accentDot, stroke: color, strokeWidth: 2 }}
        />
        <ReferenceDot
          x={latest.day}
          y={latest.balance}
          r={4}
          fill={accentDot}
          stroke={color}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SparklineChart;
