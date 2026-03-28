import { useState, useCallback } from 'react';

export interface Toast {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, severity: Toast['severity'] = 'success') => {
    setToast({ message, severity });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}
