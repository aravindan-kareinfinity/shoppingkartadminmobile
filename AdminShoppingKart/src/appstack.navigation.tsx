import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeTab} from './hometab.navigation';
import {useAppSelector} from './redux';
import {CustomIcon, CustomIcons} from './components/customicons.component';

// Screens
import {LoginScreen} from './screens/login.screen';
import {OTPLoginScreen} from './screens/otplogin.screen';
import {DashboardScreen} from './screens/dashboard.screen';
import {OrdersScreen} from './screens/orders.screen';
import {ScannerScreen} from './screens/scanner.screen';
import {CreateShipmentScreen} from './screens/createshipment.screen';

export type AppStackParamList = {
  CreateShipment: {ordergroupid: number; ordershipmentgroupid: number; orderid?: number};
  Login: undefined;
  OTPLogin: {otpid: number; mobilenumber: string};
  Home: undefined; // This is the tab navigator, no params needed
  // Add other screens as needed
};

// Extend AppStackParamList to include tab navigator screens for type safety
declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {
      // Tab navigator screens are accessible via Home tab navigator
    }
  }
}

export const AppStack = createNativeStackNavigator<AppStackParamList>();

// Export for use in navigation setup
export type AppStackParamListType = AppStackParamList;

const Stack = AppStack;

// Home Tab Navigator
function HomeTabNavigator() {
  return (
    <HomeTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <HomeTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <CustomIcon name={CustomIcons.Dashboard} color={color} size={size} />
          ),
        }}
      />
      <HomeTab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <CustomIcon name={CustomIcons.Orders} color={color} size={size} />
          ),
        }}
      />
      <HomeTab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <CustomIcon name={CustomIcons.QRCode} color={color} size={size} />
          ),
        }}
      />
    </HomeTab.Navigator>
  );
}

// Main App Navigator
export function AppNavigator() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="OTPLogin"
            component={OTPLoginScreen}
            options={{
              headerShown: true,
              headerTitle: 'Verify OTP',
              headerBackTitleVisible: false,
              headerLeft: ({tintColor}) => (
                <CustomIcon
                  name={CustomIcons.Back}
                  color={tintColor || '#000'}
                  size={24}
                />
              ),
            }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Home" component={HomeTabNavigator} />
          <Stack.Screen
            name="CreateShipment"
            component={CreateShipmentScreen}
            options={{
              headerShown: true,
              headerTitle: 'Create Shipment',
              headerBackTitleVisible: false,
              headerLeft: ({tintColor}) => (
                <CustomIcon
                  name={CustomIcons.Back}
                  color={tintColor || '#000'}
                  size={24}
                />
              ),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
