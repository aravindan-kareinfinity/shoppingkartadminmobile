import React from 'react';
import {View, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {Colors, Spacing} from '../styles';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  text: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  text,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const getVariantStyle = (): ViewStyle => {
    const variantColors: Record<BadgeVariant, {bg: string; text: string}> = {
      primary: {bg: Colors.primary, text: Colors.background},
      secondary: {bg: Colors.secondary, text: Colors.background},
      success: {bg: Colors.secondary, text: Colors.background},
      warning: {bg: '#FF9500', text: Colors.background},
      error: {bg: Colors.error, text: Colors.background},
      info: {bg: '#5AC8FA', text: Colors.background},
    };

    const colors = variantColors[variant];
    return {
      backgroundColor: colors.bg,
    };
  };

  const getTextColor = (): string => {
    const variantColors: Record<BadgeVariant, string> = {
      primary: Colors.background,
      secondary: Colors.background,
      success: Colors.background,
      warning: Colors.background,
      error: Colors.background,
      info: Colors.background,
    };
    return variantColors[variant];
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: 2,
          borderRadius: Spacing.radiusSm,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: Spacing.radiusMd,
        };
      default:
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: 4,
          borderRadius: Spacing.radiusSm,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  return (
    <View style={[getVariantStyle(), getSizeStyle(), styles.badge, style]}>
      <Text
        style={[
          styles.text,
          {color: getTextColor(), fontSize: getTextSize()},
          textStyle,
        ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
