import React, { createContext, useContext, ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { useThemeStore, ThemeMode } from '../store';
import { ThemeColors } from '../theme/colors';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { colors, isDark, mode, toggleTheme, setTheme } = useThemeStore();

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, toggleTheme, setTheme }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.darkBackground}
        translucent={false}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
