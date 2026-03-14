// Страница входа в мобильное банковское приложение OTP Bank.
// Простая mock-авторизация: пользователь выбирает аккаунт из списка (для демо).
// В реальном приложении: OAuth2, биометрия, СМС-код.
import React, { useState, useEffect } from 'react';
import { login, getUsers } from '../api/api';
import type { AuthState } from '../types/types';

interface LoginPageProps {
  onLogin: (auth: AuthState) => void;
}

interface DemoUser {
  id: number;
  name: string;
  segment: string;
}

// Иконки сегментов клиентов
const segmentEmoji: Record<string, string> = {
  mass: '👤',
  premium: '⭐',
  vip: '💎',
};

const segmentLabel: Record<string, string> = {
  mass: 'Стандарт',
  premium: 'Премиум',
  vip: 'VIP',
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем список демо-пользователей при монтировании
  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        // Fallback: используем захардкоженных пользователей для демо без бэкенда
        setUsers([
          { id: 1, name: 'Алексей Смирнов', segment: 'premium' },
          { id: 2, name: 'Мария Иванова', segment: 'mass' },
          { id: 3, name: 'Дмитрий Козлов', segment: 'vip' },
        ]);
      });
  }, []);

  const handleLogin = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await login(selectedId);
      localStorage.setItem('auth_token', resp.token);
      onLogin({
        token: resp.token,
        userId: resp.user_id,
        userName: resp.name,
        segment: resp.segment,
      });
    } catch {
      setError('Ошибка входа. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-scene">
      {/* Шапка с логотипом */}
      <div className="relative z-10 flex flex-col items-center pt-11 pb-7 px-5 text-center">
        <div className="w-16 h-16 bg-white/95 rounded-3xl flex items-center justify-center shadow-xl mb-4 border border-white/60">
          <span className="text-4xl">🏦</span>
        </div>
        <span
          className="chip mb-3"
          style={{
            color: '#ffffff',
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            borderColor: 'rgba(255, 255, 255, 0.35)',
          }}
        >
          Smart Banking Showcase
        </span>
        <h1 className="text-white text-3xl font-bold">OTP Bank</h1>
        <p className="text-white/80 text-sm mt-2 max-w-72">
          Персональная витрина продуктов в современном мобильном формате
        </p>
      </div>

      {/* Карточка входа */}
      <div className="relative z-10 login-panel px-6 pt-7 pb-10 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2 theme-transition" style={{ color: 'var(--color-text-primary)' }}>
          Выберите профиль
        </h2>
        <p className="text-sm mb-6 theme-transition" style={{ color: 'var(--color-text-muted)' }}>
          Демо-режим: выберите пользователя для просмотра персонализированной витрины
        </p>

        {/* Список пользователей */}
        <div className="space-y-3 mb-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedId(user.id)}
              className={`demo-user-row ${selectedId === user.id ? 'is-selected' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: 'var(--color-surface-alt)' }}
              >
                {segmentEmoji[user.segment] || '👤'}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium theme-transition" style={{ color: 'var(--color-text-primary)' }}>
                  {user.name}
                </div>
                <div className="text-xs theme-transition" style={{ color: 'var(--color-text-muted)' }}>
                  ID: {user.id} · {segmentLabel[user.segment] || user.segment}
                </div>
              </div>
              {selectedId === user.id && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)' }}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Ошибка */}
        {error && (
          <div
            className="text-sm p-3 rounded-xl mb-4"
            style={{
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.38)',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {/* Кнопка входа */}
        <button
          onClick={handleLogin}
          disabled={!selectedId || loading}
          className="w-full py-4 primary-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Вход...
            </span>
          ) : 'Войти'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
