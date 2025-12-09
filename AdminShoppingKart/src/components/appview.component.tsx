import React from 'react';
import {View} from 'react-native';

export function AppView({children, ...props}: any) {
  return <View {...props}>{children}</View>;
}

