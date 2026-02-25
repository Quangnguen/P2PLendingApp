import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Toast } from '../../types/toast.types';

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

// Helper để tạo ID unique
const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        id: generateId(),
        duration: 3000,
        ...action.payload,
      };
      state.toasts.push(newToast);
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { showToast, hideToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;

// Selector
export const selectToasts = (state: { toast: ToastState }) => state.toast.toasts;
