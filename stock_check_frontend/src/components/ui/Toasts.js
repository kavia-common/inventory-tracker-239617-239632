import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function newToastId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provide toast helpers and render active toasts. */
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = newToastId();
    const t = { id, title: toast.title || "Notice", text: toast.text || "", timeoutMs: toast.timeoutMs ?? 3500 };
    setToasts((prev) => [t, ...prev]);
    window.setTimeout(() => remove(id), t.timeoutMs);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastWrap" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <p className="toastTitle">{t.title}</p>
            {t.text ? <p className="toastText">{t.text}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Access toast push() helper. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}
