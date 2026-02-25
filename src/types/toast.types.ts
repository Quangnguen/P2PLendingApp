export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number; // in milliseconds
}

export interface ToastState {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    hideToast: (id: string) => void;
    clearToasts: () => void;
}