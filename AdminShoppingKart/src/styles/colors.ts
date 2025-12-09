/**
 * Color palette for the application
 * Based on Quanto brand colors from logo
 * Logo features: Orange (#f49f2a), Dark Gray/Charcoal (#2C2C2C), Black, Light Gray
 */

export const ColorPalette = {
  // Primary colors - Quanto Orange (from logo graphic element)
  primary: '#f49f2a',
  primaryDark: '#d6891a',
  primaryLight: '#f7b85a',
  
  // Secondary colors - Dark Gray/Charcoal (from logo text)
  secondary: '#2C2C2C',
  secondaryDark: '#1A1A1A',
  secondaryLight: '#4A4A4A',
  
  // Quanto brand colors
  orange: '#f49f2a',
  darkGray: '#2C2C2C',
  charcoal: '#2C2C2C',
  
  // Status colors
  success: '#34C759',
  warning: '#f49f2a', // Quanto orange for warnings
  error: '#FF3B30',
  info: '#f49f2a', // Quanto orange for info (matching brand)
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Text colors - Based on Quanto logo
  text: '#2C2C2C', // Dark gray/charcoal like "Quanto" text
  textSecondary: '#9CA3AF', // Light gray like "retailing reinvented" tagline
  textTertiary: '#6B7280', // Medium gray
  textInverse: '#FFFFFF',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#E5E5E5',
  
  // Border colors
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',
  
  // Input colors
  inputBackground: '#F5F5F5',
  inputBorder: '#E5E5E5',
  inputFocus: '#f49f2a', // Quanto orange for focus states
  
  // Divider
  divider: '#E5E5E5',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Transparent
  transparent: 'transparent',
};

// Legacy Colors export for backward compatibility
export const Colors = {
  background: ColorPalette.background,
  text: ColorPalette.text,
  textSecondary: ColorPalette.textSecondary,
  primary: ColorPalette.primary,
  secondary: ColorPalette.secondary,
  error: ColorPalette.error,
  divider: ColorPalette.divider,
  inputBackground: ColorPalette.inputBackground,
  overlay: ColorPalette.overlay,
  danger: ColorPalette.error, // Alias for error
};
