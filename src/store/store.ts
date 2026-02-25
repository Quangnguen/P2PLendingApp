import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  authReducer,
  openBankingReducer,
  toastReducer,
} from './slices';

// Root reducer (không cần persist vì theme dùng Zustand với persist riêng)
const rootReducer = combineReducers({
  auth: authReducer,
  openBanking: openBankingReducer,
  toast: toastReducer,
});

// Store
export const store = configureStore({
  reducer: rootReducer,
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
