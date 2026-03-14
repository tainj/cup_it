// Toast-уведомление для отображения аналитических событий.
// По требованию задания: "в UI выводи уведомление при клике (имитация отправки события)".
// Это также помогает пользователю видеть, что его действие зарегистрировано.
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 toast">
      <div
        className="text-sm px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap theme-transition"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-border) 88%, transparent)',
          color: 'var(--color-text-primary)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span className="text-base" style={{ color: 'var(--color-accent)' }}>📊</span>
        {message}
      </div>
    </div>
  );
};

export default Toast;
