import React from 'react';
import {View, Text, TextInput, TextInputProps, TouchableOpacity} from 'react-native';
import {Colors, $} from '../styles';

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
    <View style={[$.mb_2, containerStyle]}>
      {label && <Text style={[$.h7, $.font_weight_500, $.mb_1, $.text_plain]}>{label}</Text>}
      <View
        style={[
          $.flex_row,
          $.align_items_center,
          $.border,
          error ? $.border_danger : $.border_default,
          $.border_rounded_1,
          $.px_3,
          $.bg_inputbg,
        ]}>
        {leftIcon && <View style={[$.mr_05]}>{leftIcon}</View>}
        <TextInput
          style={[
            {flex: 1, height: 48, fontSize: 16, color: Colors.text},
            ...(leftIcon ? [{marginLeft: 4}] : []),
          ]}
          placeholderTextColor={Colors.textSecondary}
          {...textInputProps}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={[$.p_1, $.ml_05]}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[$.small, $.text_danger, $.mt_05]}>{error}</Text>}
    </View>
  );
}
