import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastItem({ id, message, type, duration, onClose }: any) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration ?? 1800);
    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  // TinySteps theme colors: primary purple #6B4EFF, accent #FF7A00
  const bgStyle: any =
    type === "success"
      ? { backgroundColor: "#16A34A" } // green-600
      : type === "error"
      ? { backgroundColor: "#DC2626" } // red-600
      : { backgroundColor: "#6B4EFF" }; // primary purple

  return (
    <div style={bgStyle} className={`px-5 py-3 rounded-lg shadow-lg text-white transform transition-all ${visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}>
      {message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<any>>([]);

  const showToast = ({ message, type = "info", duration = 1800 }: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message, type, duration }]);
  };

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} duration={t.duration} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
