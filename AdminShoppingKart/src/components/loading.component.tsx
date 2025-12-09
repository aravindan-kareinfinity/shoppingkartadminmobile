import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {Colors, $} from '../styles';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = 'large',
  color = Colors.primary,
  message,
  fullScreen = false,
}: LoadingProps) {
  const containerStyle = fullScreen
    ? [styles.fullScreen, $.flex_1, $.justify_content_center, $.align_items_center]
    : [styles.container, $.justify_content_center, $.align_items_center];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, {color: Colors.textSecondary}, $.mt_3]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  fullScreen: {
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: 14,
    marginTop: 12,
  },
});
