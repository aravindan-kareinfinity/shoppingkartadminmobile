import React from 'react';
import {View, StyleSheet, ViewStyle, TouchableOpacity} from 'react-native';
import {Colors, Spacing, Shadows} from '../styles';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
  shadow?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: number;
}

export function Card({
  children,
  style,
  onPress,
  padding = Spacing.lg,
  shadow = 'small',
  borderRadius = Spacing.radiusMd,
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: Colors.background,
    borderRadius,
    padding,
    ...(shadow !== 'none' ? Shadows[shadow] : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
