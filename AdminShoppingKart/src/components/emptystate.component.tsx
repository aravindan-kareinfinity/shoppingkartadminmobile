import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, $, Spacing} from '../styles';
import {CustomIcon, CustomIcons} from './customicons.component';

interface EmptyStateProps {
  icon?: CustomIcons | string;
  title?: string;
  message?: string;
  actionButton?: React.ReactNode;
}

export function EmptyState({
  icon = CustomIcons.Search,
  title = 'No Data',
  message = 'There is no data to display',
  actionButton,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, $.flex_1, $.justify_content_center, $.align_items_center]}>
      <CustomIcon name={icon} color={Colors.textSecondary} size={64} />
      {title && (
        <Text style={[styles.title, $.mt_4, {color: Colors.text}]}>{title}</Text>
      )}
      {message && (
        <Text style={[styles.message, $.mt_2, {color: Colors.textSecondary}]}>
          {message}
        </Text>
      )}
      {actionButton && <View style={$.mt_4}>{actionButton}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
});
