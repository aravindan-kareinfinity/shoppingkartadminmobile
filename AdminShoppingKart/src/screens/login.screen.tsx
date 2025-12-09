import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../appstack.navigation';
import {FormInput} from '../components/forminput.component';
import {Colors, $} from '../styles';
import {UsersService} from '../services/users.service';
import {UsersGetOtpReq} from '../models/users.model';
import {ErrorCodes} from '../models/actionres.model';

type LoginScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usersService = new UsersService();

  // Validation pattern matching web app exactly
  const mobileRegex = /^((\+91-?)|0)?[0-9]{10}$/;

  const validateMobile = (value: string): string => {
    if (!value.trim()) {
      return 'Required';
    }
    if (!mobileRegex.test(value.trim())) {
      return 'Please enter a valid mobile number (10 digits)';
    }
    return '';
  };

  const handleMobileChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setMobileNumber(numericText);
    if (isTouched) {
      setMobileError(validateMobile(numericText));
    }
  };

  const handleMobileBlur = () => {
    setIsTouched(true);
    setMobileError(validateMobile(mobileNumber));
  };

  const handleLogin = async () => {
    console.log('handleLogin called, mobileNumber:', mobileNumber);
    setIsTouched(true);
    const error = validateMobile(mobileNumber);
    if (error) {
      console.log('Validation error:', error);
      setMobileError(error);
      return;
    }

    try {
      setIsLoading(true);
      // Match web app exactly - using UsersGetOtpReq with createuserifnotfound default (false)
      const request: UsersGetOtpReq = {
        mobilenumber: mobileNumber.trim(),
        createuserifnotfound: false, // Match web app default
      };
      console.log('Making API call with request:', JSON.stringify(request));
      const otpid = await usersService.getOtp(request);
      console.log('API response - otpid:', otpid);

      if (otpid > 0) {
        // Navigate to OTP screen
        navigation.navigate('OTPLogin', {
          otpid,
          mobilenumber: mobileNumber.trim(),
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Match web app exactly: error.error.message and error.error.code
      let message = error?.response?.data?.message || error?.message;
      let code = error?.response?.data?.code;

      // Handle VendorNotApproved error - matching web app exactly (using == for loose equality like web)
      if (code == ErrorCodes.VendorNotApproved) {
        message = 'Your account is not approved yet. Contact support for further assistance.';
      }

      Alert.alert('Error', message);
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
            <Image
              source={require('../asserts/quanto_dark.png')}
              style={{
                width: 200,
                height: 80,
                resizeMode: 'contain',
                marginBottom: 32,
              }}
            />
          </View>

          <View style={$.mb_4}>
            <View style={[$.flex_row, $.align_items_center]}>
              <View
                style={[
                  {
                    height: 48,
                    borderWidth: 1,
                    borderColor: mobileError ? Colors.error : Colors.divider,
                    borderRightWidth: 0,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                    backgroundColor: Colors.inputBackground,
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <Text style={[$.h5, {color: Colors.text, fontWeight: '500'}]}>
                  +91
                </Text>
              </View>
              <TextInput
                style={[
                  {
                    flex: 1,
                    height: 48,
                    borderWidth: 1,
                    borderColor: mobileError ? Colors.error : Colors.divider,
                    borderLeftWidth: 0,
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                    backgroundColor: Colors.inputBackground,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    color: Colors.text,
                  },
                ]}
                value={mobileNumber}
                onChangeText={handleMobileChange}
                onBlur={handleMobileBlur}
                placeholder="Mobile number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
            {mobileError && isTouched && (
              <Text style={[$.h6, {color: Colors.error, marginTop: 4, paddingLeft: 4}]}>
                {mobileError}
              </Text>
            )}
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
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h4, $.font_weight_600, {color: Colors.background}]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
