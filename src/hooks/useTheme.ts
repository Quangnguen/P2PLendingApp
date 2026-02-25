import { useThemeStore } from '../store/themeStore';

export const useTheme = () => {
  const { colors, mode, isDark, toggleTheme, setTheme } = useThemeStore();

  return {
    colors,
    mode,
    isDark,
    toggleTheme,
    setTheme,
  };
};

export default useTheme;