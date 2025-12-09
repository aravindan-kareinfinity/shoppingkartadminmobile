import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {Colors, $} from '../styles';
import {HomeTabParamList} from '../hometab.navigation';

type HomeScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <ScrollView style={[$.flex_1, $.px_4, $.py_3]}>
        <View style={[$.mb_5]}>
          <Text style={[$.h3, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
            Dashboard
          </Text>
          <Text style={[$.h5, {color: Colors.textSecondary}]}>
            Welcome to Admin Shopping Kart
          </Text>
        </View>

        <View style={[$.mb_4]}>
          <TouchableOpacity
            style={[
              $.py_4,
              $.px_4,
              $.border_rounded_2,
              {backgroundColor: Colors.primary},
              $.mb_3,
            ]}
            onPress={() => navigation.navigate('Scanner')}>
            <Text style={[$.h4, $.font_weight_600, {color: Colors.background}]}>
              Scanner
            </Text>
            <Text style={[$.h6, {color: Colors.background, opacity: 0.8}]}>
              Scan barcode to search orders
            </Text>
          </TouchableOpacity>

          {/* Add more dashboard items as needed */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
