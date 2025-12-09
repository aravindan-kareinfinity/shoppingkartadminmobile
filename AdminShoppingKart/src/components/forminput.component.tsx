import React from 'react';
import {View, Text, TextInput, TextInputProps, TouchableOpacity, StyleSheet} from 'react-native';
import {Colors} from '../styles';

interface FormInputProps extends TextInputProps {
  label?: string;
  containerStyle?: any;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  leftIcon?: React.ReactNode;
  error?: string;
}

export function FormInput({
  label,
  containerStyle,
  rightIcon,
  onRightIconPress,
  leftIcon,
  error,
  ...textInputProps
}: FormInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
          placeholderTextColor={Colors.textSecondary}
          {...textInputProps}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Spacing constants based on spacer (8px base)
const SPACER = 8;
const SPACING = {
  xs: SPACER * 0.5,    // 4
  sm: SPACER,          // 8
  md: SPACER * 1.5,    // 12
  lg: SPACER * 2,      // 16
  xl: SPACER * 2.5,    // 20
  xxl: SPACER * 3,     // 24
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: SPACING.sm, // 8px
    paddingHorizontal: SPACING.md,
    backgroundColor: Colors.inputBackground,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  inputWithLeftIcon: {
    marginLeft: SPACING.sm,
  },
  leftIconContainer: {
    marginRight: SPACING.xs,
  },
  iconContainer: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: SPACING.xs,
  },
});
