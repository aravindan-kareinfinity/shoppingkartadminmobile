import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {OrderGetWithDetailsRes, Orders, OrderTypes, OrderGetCustomerSummaryRes, GetWithDetailCustomerRes} from '../../models/orders.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {Colors, $, ColorPalette} from '../../styles';
import {formatPrice} from '../../utils/format.utils';
import {formatDateGB} from '../../utils/date.utils';

type CustomerOrdersTabNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

export type CustomerOrdersTabProps = {
  data: GetWithDetailCustomerRes[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  keyExtractor: (item: GetWithDetailCustomerRes) => string;
  listContainerStyle?: StyleProp<ViewStyle>;
};

// CustomerSummaryCard component
function CustomerSummaryCard({item, navigation}: {item: GetWithDetailCustomerRes; navigation: CustomerOrdersTabNavigationProp}) {
  return (
    <TouchableOpacity
      style={[
        $.bg_background,
        $.border_rounded_2,
        $.px_3,
        $.py_2,
        $.border,
        {
          marginBottom: 8,
          borderColor: Colors.divider,
        },
      ]}>
      <View
        style={[
          $.flex_row,
          $.justify_content_spaceBetween,
          $.align_items_center,
          $.mb_1,
        ]}>
        <View style={[$.flex_1]}>
          <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
            {item.customername || `Customer ${item.customerid}`}
          </Text>
          {item.customermobilenumber && (
            <Text
              numberOfLines={1}
              style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]}>
              {item.customermobilenumber}
            </Text>
          )}
        </View>
        <View style={[$.align_items_end]}>
          <View
            style={[
              $.px_2,
              $.py_1,
              $.border_rounded,
              {
                backgroundColor: ColorPalette.success,
                borderWidth: 0,
              },
            ]}>
            <Text style={[$.h7, {color: Colors.text}]} numberOfLines={1}>
              {item.totalorders} Orders
            </Text>
          </View>
        </View>
      </View>

      <View style={[$.mt_1, $.gap_1]}>
        {item.customeremail && (
          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
            <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
              Email
            </Text>
            <Text
              numberOfLines={1}
              style={[$.h7, {color: Colors.text}, $.flex_1]}>
              {item.customeremail}
            </Text>
          </View>
        )}

        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
          <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
            Quantity
          </Text>
          <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.flex_1]}>
            {item.totalquantity.toFixed(2)}
          </Text>
        </View>

        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
          <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
            Total
          </Text>
          <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.flex_1]}>
            {formatPrice(item.totalnetprice)}
          </Text>
        </View>

        {item.lastorderdate && (
          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
            <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
              Last Order
            </Text>
            <Text style={[$.h7, {color: Colors.text}, $.flex_1]}>
              {formatDateGB(item.lastorderdate)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function CustomerOrdersTab(props: CustomerOrdersTabProps) {
  const {data, isLoading, hasActiveFilters, onClearFilters, onRefresh, keyExtractor, listContainerStyle} =
    props;
  const navigation = useNavigation<CustomerOrdersTabNavigationProp>();

  // Ensure data is always an array
  const safeData = data || [];

  const renderCustomerCard = ({item}: {item: GetWithDetailCustomerRes}) => (
    <CustomerSummaryCard item={item} navigation={navigation} />
  );

  if (isLoading && safeData.length === 0) {
    return (
      <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (safeData.length === 0) {
    return (
      <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
        <Text style={[$.h5, {color: Colors.textSecondary}]}>No orders found</Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[$.mt_3, $.py_2, $.px_4, $.border_rounded_1, $.bg_inputbg]}
            onPress={onClearFilters}>
            <Text style={[$.h6, {color: Colors.primary}]}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={safeData}
      renderItem={renderCustomerCard}
      keyExtractor={keyExtractor}
      contentContainerStyle={listContainerStyle}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}
