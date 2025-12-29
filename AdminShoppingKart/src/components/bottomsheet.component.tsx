import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {Colors, $} from '../styles';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string | number;
  showHandle?: boolean;
  scrollable?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height = '50%',
  showHandle = true,
  scrollable = true,
}: BottomSheetProps) {
  const sheetHeight = typeof height === 'string' 
    ? (parseFloat(height) / 100) * Dimensions.get('window').height 
    : height;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={[$.flex_1, $.bg_overlay, $.justify_content_end]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}} />
        </TouchableWithoutFeedback>
        <View
          style={[
            $.bg_background,
            $.w_100,
            {overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: sheetHeight},
          ]}>
          {showHandle && (
            <TouchableOpacity
              onPress={onClose}
              style={[$.w_100, $.align_items_center, $.py_1]}
              activeOpacity={0.7}>
              <View style={{width: 40, height: 4, backgroundColor: Colors.divider, borderRadius: 2}} />
            </TouchableOpacity>
          )}
          {scrollable ? (
            <ScrollView
              style={[$.flex_1]}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[$.p_2, {paddingBottom: 20}]}
              nestedScrollEnabled={true}
              bounces={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            <View style={[$.p_2, $.flex_1]}>
              {children}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
