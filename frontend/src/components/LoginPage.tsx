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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Шапка с логотипом */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-3xl">🏦</span>
        </div>
        <h1 className="text-white text-2xl font-bold">OTP Bank</h1>
        <p className="text-blue-200 text-sm mt-1">Витрина продуктов — MVP</p>
      </div>

      {/* Карточка входа */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <h2 className="text-gray-800 text-xl font-semibold mb-2">Выберите профиль</h2>
        <p className="text-gray-500 text-sm mb-6">
          Демо-режим: выберите пользователя для просмотра персонализированной витрины
        </p>

        {/* Список пользователей */}
        <div className="space-y-3 mb-6">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedId(user.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                selectedId === user.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                {segmentEmoji[user.segment] || '👤'}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-500">ID: {user.id} · {segmentLabel[user.segment] || user.segment}</div>
              </div>
              {selectedId === user.id && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Кнопка входа */}
        <button
          onClick={handleLogin}
          disabled={!selectedId || loading}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition-all"
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
