import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ThemeColors } from '@/theme/colors';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
    mode: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'light',
            colors: LightColors,
            isDark: false,
            toggleTheme: () => {
                const newMode = get().mode === 'light' ? 'dark' : 'light';
                set({
                    mode: newMode,
                    colors: newMode === 'light' ? LightColors : DarkColors,
                    isDark: newMode === 'dark',
                })
            },

            setTheme: (mode: ThemeMode) => {
                set({
                    mode,
                    colors: mode === 'light' ? LightColors : DarkColors,
                    isDark: mode === 'dark',
                });
            }
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ mode: state.mode }), // Only persist mode
            onRehydrateStorage: () => (state) => {
                // Restore colors after rehydration
                if (state) {
                state.colors = state.mode === 'dark' ? DarkColors : LightColors;
                state.isDark = state.mode === 'dark';
                }
            },
        }
    )
);