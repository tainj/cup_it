// Корневой компонент приложения OTP Bank MVP.
// Управляет состоянием авторизации и маршрутизацией между страницами.
// Простой паттерн: если есть токен → показываем витрину, иначе → форму входа.
import { useState, useEffect, useCallback } from 'react';
import type { AuthState } from './types/types';
import LoginPage from './components/LoginPage';
import ShowcaseComponent from './components/ShowcaseComponent';
import './index.css';

// Инициализируем состояние авторизации из localStorage (lazy init).
// Lazy init выполняется только при первом рендере — без useEffect.
function getInitialAuth(): AuthState {
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');
  const userName = localStorage.getItem('user_name');
  const segment = localStorage.getItem('user_segment');

  if (token && userId) {
    return {
      token,
      userId: parseInt(userId, 10),
      userName,
      segment,
    };
  }
  return { token: null, userId: null, userName: null, segment: null };
}

function App() {
  const [auth, setAuth] = useState<AuthState>(getInitialAuth);

  const handleLogout = useCallback(() => {
    setAuth({ token: null, userId: null, userName: null, segment: null });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_segment');
  }, []);

  // Слушаем событие истечения сессии (из API интерсептора)
  useEffect(() => {
    window.addEventListener('auth:expired', handleLogout);
    return () => window.removeEventListener('auth:expired', handleLogout);
  }, [handleLogout]);

  const handleLogin = (newAuth: AuthState) => {
    setAuth(newAuth);
    // Сохраняем данные сессии в localStorage
    if (newAuth.token) localStorage.setItem('auth_token', newAuth.token);
    if (newAuth.userId) localStorage.setItem('user_id', String(newAuth.userId));
    if (newAuth.userName) localStorage.setItem('user_name', newAuth.userName);
    if (newAuth.segment) localStorage.setItem('user_segment', newAuth.segment);
  };

  // Маршрутизация: авторизован → витрина, иначе → логин
  if (auth.token && auth.userId) {
    return <ShowcaseComponent auth={auth} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default App;
