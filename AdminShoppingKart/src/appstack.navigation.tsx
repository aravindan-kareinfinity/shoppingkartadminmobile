import {createNativeStackNavigator} from '@react-navigation/native-stack';

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
