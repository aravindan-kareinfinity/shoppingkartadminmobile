import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
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
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayBackdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, {height: sheetHeight}]}>
          {showHandle && (
            <TouchableOpacity onPress={onClose} style={styles.handleContainer} activeOpacity={0.7}>
              <View style={styles.handle} />
            </TouchableOpacity>
          )}
          {scrollable ? (
            <ScrollView 
              style={styles.scrollContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
              nestedScrollEnabled={true}
              bounces={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            <View style={styles.nonScrollableContent}>
              {children}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  nonScrollableContent: {
    padding: 16,
    flex: 1,
  },
});
