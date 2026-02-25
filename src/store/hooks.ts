import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { showToast, hideToast } from './slices';
import { ToastType } from '../types/toast.types';

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Toast helper hook
export const useToast = () => {
  const dispatch = useAppDispatch();

  const show = (type: ToastType, message: string, title?: string, duration?: number) => {
    dispatch(showToast({ type, message, title, duration }));
  };

  return {
    success: (message: string, title?: string, duration?: number) => 
      show('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) => 
      show('error', message, title, duration),
    warning: (message: string, title?: string, duration?: number) => 
      show('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) => 
      show('info', message, title, duration),
  };
};

// Selector hooks
export const useAuth = () => useAppSelector((state) => state.auth);
export const useOpenBanking = () => useAppSelector((state) => state.openBanking);
export const useToasts = () => useAppSelector((state) => state.toast.toasts);
