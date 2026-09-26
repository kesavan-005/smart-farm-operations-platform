import { useState, useEffect } from 'react';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

export type ToastType = ToastOptions & {
  id: string;
};

let listeners: Array<(toasts: ToastType[]) => void> = [];
let memoryToasts: ToastType[] = [];

const notify = () => {
  listeners.forEach((listener) => listener([...memoryToasts]));
};

export const toast = (options: ToastOptions) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastType = { ...options, id };
  memoryToasts.push(newToast);
  notify();

  const duration = options.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  }

  return {
    id,
    dismiss: () => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      notify();
    },
  };
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastType[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      notify();
    },
  };
}
