// Dark Theme Colors
export const DarkColors = {
  // App Background
  appBackground: '#111827',
  cardBackground: '#1F2937',
  darkBackground: '#0D1117',
  darkSurface: '#161B22',
  darkBorder: '#30363D',

  // Text Colors
  textWhite: '#FFFFFF',
  textGray: '#9CA3AF',
  textDark: '#1F2937',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',

  // Accent Colors
  accentBlue: '#58A6FF',
  primaryBlue: '#2979FF',
  cyanButton: '#06B6D4',

  // Status Colors
  greenSuccess: '#10B981',
  yellowWarning: '#F59E0B',
  redError: '#EF4444',

  // Gradient Colors
  gradientStart: '#EAB308',
  gradientEnd: '#14B8A6',

  // Others
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Light Theme Colors
export const LightColors = {
  // App Background
  appBackground: '#F3F4F6',
  cardBackground: '#FFFFFF',
  darkBackground: '#FFFFFF',
  darkSurface: '#F9FAFB',
  darkBorder: '#E5E7EB',

  // Text Colors
  textWhite: '#1F2937',
  textGray: '#6B7280',
  textDark: '#1F2937',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',

  // Accent Colors
  accentBlue: '#2563EB',
  primaryBlue: '#1D4ED8',
  cyanButton: '#0891B2',

  // Status Colors
  greenSuccess: '#059669',
  yellowWarning: '#D97706',
  redError: '#DC2626',

  // Gradient Colors
  gradientStart: '#EAB308',
  gradientEnd: '#14B8A6',

  // Others
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Type for theme colors
export type ThemeColors = typeof DarkColors;

// Default export (Dark theme for backwards compatibility)
export const Colors = DarkColors;

export default Colors;