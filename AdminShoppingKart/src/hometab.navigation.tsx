import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

export type HomeTabParamList = {
  Scanner: {groupid?: number} | undefined;
  Dashboard: undefined;
  Orders: undefined;
  // Add other screens as needed
};

export const HomeTab = createBottomTabNavigator<HomeTabParamList>();

// Export for use in navigation setup
export type HomeTabStackParamList = HomeTabParamList;
