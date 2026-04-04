import { useState, useCallback } from 'react';

let toastId = 0;

const listeners = new Set();
let toasts = [];

function emit() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function toast(message, variant = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3000);
}

export function useToast() {
  const [state, setState] = useState([]);

  useState(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  });

  const success = useCallback((msg) => toast(msg, 'success'), []);
  const error = useCallback((msg) => toast(msg, 'error'), []);
  const info = useCallback((msg) => toast(msg, 'info'), []);

  return { toasts: state, success, error, info };
}
