import React, { createContext, useContext, useState, useEffect } from 'react';

type ToastMessage = { id: number; msg: string; kind: string };

interface ToastContextValue {
  toast: (msg: string, kind?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (msg: string, kind = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, kind }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3400);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toasts">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
