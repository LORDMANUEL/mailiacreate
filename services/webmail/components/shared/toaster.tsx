"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

let listeners: ((toast: Toast) => void)[] = [];
let counter = 0;

export function sendToast(toast: Omit<Toast, "id">) {
  const payload = { ...toast, id: ++counter };
  listeners.forEach((listener) => listener(payload));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((current) => [...current, toast]);
      setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4000);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((cb) => cb !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            className="rounded-lg bg-foreground/90 px-4 py-3 text-sm text-background shadow-lg backdrop-blur"
          >
            <p className="font-semibold">{toast.title}</p>
            {toast.description ? <p className="text-xs opacity-80">{toast.description}</p> : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
