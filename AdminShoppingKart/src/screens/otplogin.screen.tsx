import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../appstack.navigation';
import {Colors, $} from '../styles';
import {UsersService} from '../services/users.service';
import {AuthService} from '../services/auth.service';
import {UsersValidateOtpReq} from '../models/users.model';
import {ErrorCodes} from '../models/actionres.model';
import {useAppDispatch, loginSuccess, setFromValidateOtp} from '../redux';

type OTPLoginScreenRouteProp = RouteProp<AppStackParamList, 'OTPLogin'>;
type OTPLoginScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export function OTPLoginScreen() {
  const route = useRoute<OTPLoginScreenRouteProp>();
  const navigation = useNavigation<OTPLoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const otpInputRef = useRef<TextInput>(null);

  const usersService = new UsersService();
  const authService = new AuthService();

  const otpid = route.params.otpid;
  const mobilenumber = route.params.mobilenumber;

  useEffect(() => {
    // Focus OTP input when screen loads
    setTimeout(() => {
      otpInputRef.current?.focus();
    }, 100);
  }, []);

  const handleVerifyOTP = async () => {
    // Match web app - validate form
    if (!otp.trim() || otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    if (otpid <= 0) {
      Alert.alert('Error', 'Invalid OTP session. Please login again.');
      navigation.goBack();
      return;
    }

    try {
      setIsLoading(true);
      // Match web app exactly - using UsersValidateOtpReq
      const request: UsersValidateOtpReq = {
        otpid: otpid,
        otp: otp.trim(),
      };
      
      const response = await usersService.validateOtp(request);

      // Match web app exactly: if (!(resp.user.issystem || resp.user.isvendor))
      if (!(response.user.issystem || response.user.isvendor)) {
        Alert.alert('Error', 'Access Denied');
        return;
      }

      // Match web app exactly - save tokens and user
      await authService.setAuthToken(response.accesstoken);
      await authService.setRefreshToken(response.refreshtoken);
      await authService.setUser(response.user);

      // Update Redux store with authentication state
      dispatch(
        loginSuccess({
          user: response.user,
          token: response.accesstoken,
          refreshToken: response.refreshtoken,
        }),
      );

      // Store user context in Redux
      dispatch(
        setFromValidateOtp({
          user: response.user,
          accesstoken: response.accesstoken,
          refreshtoken: response.refreshtoken,
        }),
      );

      // Navigate to home/dashboard (web navigates to 'home', 'dashboard')
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    } catch (error: any) {
      console.error('OTP verification error:', error);
      // Match web app exactly: error.error.message
      let message = error?.response?.data?.message || error?.message;
      
      Alert.alert('Error', message);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!mobilenumber) {
      Alert.alert('Error', 'Mobile number not found');
      return;
    }

    try {
      setIsLoading(true);
      // Match web app - using UsersGetOtpReq
      const newOtpId = await usersService.getOtp({
        mobilenumber,
        createuserifnotfound: false,
      });

      if (newOtpId > 0) {
        Alert.alert('Success', 'OTP has been resent to your mobile number');
        // Update route params with new otpid if needed
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={$.flex_1}>
        <View style={[$.flex_1, $.justify_content_center, $.px_4]}>
          <View style={[$.mb_5, $.align_items_center]}>
            <Text style={[$.h3, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
              Verify with OTP
            </Text>
            <Text style={[$.h5, {color: Colors.textSecondary}]}>
              Enter the OTP sent to {mobilenumber || 'your mobile number'}
            </Text>
          </View>

          <View style={$.mb_4}>
            <Text style={[$.h5, {color: Colors.text}, $.mb_2]}>OTP</Text>
            <TextInput
              ref={otpInputRef}
              style={[
                {
                  height: 56,
                  borderWidth: 1,
                  borderColor: Colors.divider,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  fontSize: 24,
                  fontWeight: '600',
                  letterSpacing: 8,
                  textAlign: 'center',
                  color: Colors.text,
                },
              ]}
              value={otp}
              onChangeText={(text) => {
                // Only allow numbers and limit to 4 digits
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                setOtp(numericText);
              }}
              placeholder="0000"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleVerifyOTP}
            />
          </View>

          <TouchableOpacity
            style={[
              $.py_4,
              $.px_4,
              $.border_rounded_2,
              $.align_items_center,
              $.justify_content_center,
              {backgroundColor: Colors.primary},
              $.mb_3,
            ]}
            onPress={handleVerifyOTP}
            disabled={isLoading || otp.length !== 4}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h4, $.font_weight_600, {color: Colors.background}]}>
                Verify
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={isLoading}
            style={[$.align_items_center, $.mt_3]}>
            <Text style={[$.h5, {color: Colors.primary}]}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
