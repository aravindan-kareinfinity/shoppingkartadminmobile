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
import {OrderGetWithDetailsRes, Orders, OrderTypes} from '../../models/orders.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {Colors, $, ColorPalette} from '../../styles';
import {formatPrice} from '../../utils/format.utils';
import {formatDateGB} from '../../utils/date.utils';

type DefaultOrdersTabNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

export type DefaultOrdersTabProps = {
  data: OrderGetWithDetailsRes[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  keyExtractor: (item: OrderGetWithDetailsRes) => string;
  listContainerStyle?: StyleProp<ViewStyle>;
};

const getStatusColor = (status: number, type: number) => {
  if (status === 100 || status === 200) {
    return {bg: ColorPalette.warning, text: Colors.text};
  }
  if ([600, 700, 1000].includes(status)) {
    return {bg: ColorPalette.warning, text: Colors.text};
  }
  if ([300, 400, 500].includes(status)) {
    return {bg: ColorPalette.success, text: Colors.text};
  }
  if ([800, 900].includes(status)) {
    return {bg: ColorPalette.error, text: Colors.background};
  }
  if (status === 1100) {
    return {bg: ColorPalette.transparent, text: Colors.text};
  }
  return {bg: Colors.divider, text: Colors.text};
};

// OrderCard component
function OrderCard({item, navigation}: {item: OrderGetWithDetailsRes; navigation: DefaultOrdersTabNavigationProp}) {
  const statusColor = getStatusColor(item.status, item.type || 0);
  const statusName = Orders.getOrderStatusName(item.status);

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
      ]}
      onPress={() => {
        if (item.groupid) {
          navigation.navigate('Scanner', {groupid: item.groupid});
        }
      }}>
      <View
        style={[
          $.flex_row,
          $.justify_content_spaceBetween,
          $.align_items_center,
          $.mb_1,
        ]}>
        <View style={[$.flex_1]}>
          <View style={[$.flex_row, $.align_items_center]}>
            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
              {item.displayid && item.displayid.length > 0 ? ` ${item.displayid}` : `Group ${item.id}`}   -      QTY {item.quantity}
            </Text>
          </View>
          {item.customername && (
            <Text
              numberOfLines={1}
              style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]}>
              {item.customername}
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
                backgroundColor: statusColor.bg,
                borderWidth: item.status === 1100 ? 1 : 0,
                borderColor: Colors.divider,
              },
            ]}>
            <Text style={[$.h7, {color: statusColor.text}]} numberOfLines={1}>
              {statusName}
            </Text>
          </View>
          {item.type === OrderTypes.Return && (
            <Text style={[$.h7, {color: Colors.error, marginTop: 2}]}>
              Return
            </Text>
          )}
        </View>
      </View>

      <View style={[$.mt_1, $.gap_1]}>
        {item.designcode && (
          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
            <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
              Design :
            </Text>
            <Text
              numberOfLines={1}
              style={[$.h7, $.font_weight_600, {color: Colors.text}, $.flex_1]}>
              {item.designcode} - {item.productname}
            </Text>
          </View>
        )}

        {item.skudesignattributestring && (
          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
            <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
              SKU :
            </Text>
            <Text
              numberOfLines={1}
              style={[$.h7, {color: Colors.text}, $.flex_1]}>
              {item.skudesignattributestring}
            </Text>

            <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
              {formatPrice(item.netprice)}
            </Text>
          </View>
        )}

        {item.createdon && (
          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
            <Text style={[$.h7, {color: Colors.textSecondary, width: 70}]}>
              Date :
            </Text>
            <Text style={[$.h7, {color: Colors.text}, $.flex_1]}>
              {formatDateGB(item.createdon)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function DefaultOrdersTab(props: DefaultOrdersTabProps) {
  const {data, isLoading, hasActiveFilters, onClearFilters, onRefresh, keyExtractor, listContainerStyle} =
    props;
  const navigation = useNavigation<DefaultOrdersTabNavigationProp>();

  // Ensure data is always an array
  const safeData = data || [];

  const renderOrderCard = ({item}: {item: OrderGetWithDetailsRes}) => (
    <OrderCard item={item} navigation={navigation} />
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
      renderItem={renderOrderCard}
      keyExtractor={keyExtractor}
      contentContainerStyle={listContainerStyle}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}
