import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {Colors, Spacing} from '../styles';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  marginVertical?: number;
}

export function Divider({
  style,
  color = Colors.divider,
  thickness = 1,
  marginVertical = Spacing.md,
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          height: thickness,
          marginVertical,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});
