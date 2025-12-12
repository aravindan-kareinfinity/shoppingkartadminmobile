import React, {useState, useEffect} from 'react';
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
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../appstack.navigation';
import {Colors, $} from '../styles';
import {UsersService} from '../services/users.service';
import {UsersGetOtpReq} from '../models/users.model';
import {ErrorCodes} from '../models/actionres.model';
import {useAppSelector, useAppDispatch} from '../redux/hooks.redux';
import {selectenvironment, environmentactions} from '../redux/environment.redux';
import {environment} from '../utils/environment';
import {CustomIcon, CustomIcons} from '../components/customicons.component';

type LoginScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const environmentState = useAppSelector(selectenvironment);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    environmentState.url || environment.baseurl,
  );

  // Update local state when Redux state changes
  useEffect(() => {
    setBaseUrl(
      environmentState.url || environment.baseurl,
    );
  }, [environmentState.url]);

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
        message =
          'Your account is not approved yet. Contact support for further assistance.';
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

const handleSaveUrl = () => {
  const url = baseUrl.trim();

  if (url) {
    // No validation — accept whatever user enters
    dispatch(environmentactions.setBaseUrl(url));
    setShowUrlEditor(false);

    Alert.alert('Success', 'Base URL updated successfully');
  } else {
    Alert.alert('Error', 'Base URL cannot be empty');
  }
};


  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={$.flex_1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            {flexGrow: 1},
            $.justify_content_center,
            $.px_4,
            $.py_4,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Image at the top */}
          <View style={[$.mb_6, $.align_items_center]}>
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

          {/* URL Display with Edit Icon */}
          <View
            style={[
              $.mb_4,
              $.flex_row,
              $.align_items_center,
              $.justify_content_spaceBetween,
              $.px_3,
              $.py_3,
              $.border_rounded_1,
              {
                backgroundColor: Colors.inputBackground,
                borderWidth: 1,
                borderColor: Colors.divider,
              },
            ]}>
            <View style={[$.flex_1, $.mr_2]}>
              <Text style={[$.h7, {color: Colors.textSecondary}, $.mb_1]}>
                Server URL
              </Text>
              <Text
                style={[$.h6, {color: Colors.text}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {environmentState.url ||
                  environment.baseurl}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowUrlEditor(!showUrlEditor)}
              style={[$.p_2, {borderRadius: 8}]}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <CustomIcon
                name={showUrlEditor ? CustomIcons.Close : CustomIcons.Edit}
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* URL Editor */}
          {showUrlEditor && (
            <View
              style={[
                $.mb_5,
                $.p_4,
                $.border_rounded_1,
                {
                  backgroundColor: Colors.inputBackground,
                  borderWidth: 1,
                  borderColor: Colors.divider,
                },
              ]}>
              <Text style={[$.h6, {color: Colors.text}, $.mb_3]}>Base URL</Text>
              <TextInput
                style={[
                  $.border,
                  $.border_rounded_1,
                  $.px_4,
                  $.py_3,
                  $.h6,
                  $.mb_3,
                  {
                    borderColor: Colors.divider,
                    backgroundColor: Colors.background,
                    color: Colors.text,
                  },
                ]}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder={environment.baseurl}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={handleSaveUrl}
              />
              <View style={[$.flex_row, $.gap_3, $.mb_3]}>
                <TouchableOpacity
                  onPress={handleSaveUrl}
                  style={[
                    $.flex_1,
                    $.py_3,
                    $.border_rounded_1,
                    $.align_items_center,
                    {backgroundColor: Colors.primary},
                  ]}
                  activeOpacity={0.7}>
                  <Text
                    style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setBaseUrl(
                      environmentState.url ||
                        environment.baseurl,
                    );
                    setShowUrlEditor(false);
                  }}
                  style={[
                    $.flex_1,
                    $.py_3,
                    $.border_rounded_1,
                    $.align_items_center,
                    {
                      backgroundColor: Colors.inputBackground,
                      borderWidth: 1,
                      borderColor: Colors.divider,
                    },
                  ]}
                  activeOpacity={0.7}>
                  <Text style={[$.h6, {color: Colors.text}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <Text style={[$.h7, {color: Colors.textSecondary}]}>
                Current:{' '}
                {environmentState.url ||
                  environment.baseurl}
              </Text>
            </View>
          )}

          <View style={$.mb_5}>
            <TextInput
              style={[
                $.h5,
                $.border,
                $.border_rounded_2,
                {
                  height: 56,
                  borderColor: mobileError ? Colors.error : Colors.divider,
                  backgroundColor: Colors.inputBackground,
                  paddingHorizontal: 16,
                  color: Colors.text,
                },
              ]}
              value={mobileNumber}
              onChangeText={handleMobileChange}
              onBlur={handleMobileBlur}
              placeholder="Enter mobile number"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
              maxLength={10}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {mobileError && isTouched && (
              <Text
                style={[
                  $.h6,
                  {
                    color: Colors.error,
                    marginTop: 8,
                    paddingLeft: 4,
                    marginBottom: 4,
                  },
                ]}>
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
              $.mb_4,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text
                style={[$.h4, $.font_weight_600, {color: Colors.background}]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>

          {/* Spacer to ensure content stays centered when keyboard is open */}
          <View style={{height: 50}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
