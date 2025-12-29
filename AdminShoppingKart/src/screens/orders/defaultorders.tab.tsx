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

export function DefaultOrdersTab(props: DefaultOrdersTabProps) {
  const {data, isLoading, hasActiveFilters, onClearFilters, onRefresh, keyExtractor, listContainerStyle} =
    props;
  const navigation = useNavigation<DefaultOrdersTabNavigationProp>();

  // Ensure data is always an array
  const safeData = data || [];

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
        <Text style={[$.h5, $.text_muted]}>No orders found</Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[$.mt_3, $.py_2, $.px_4, $.border_rounded_1, $.bg_inputbg]}
            onPress={onClearFilters}>
            <Text style={[$.h6, $.text_primary]}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={safeData}
      renderItem={({item}) => {
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
              $.border_default,
              $.mb_2,
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
                  <Text style={[$.h6, $.font_weight_600, $.text_plain]}>
                    {item.displayid && item.displayid.length > 0 ? ` ${item.displayid}` : `Group ${item.id}`}   -      QTY {item.quantity}
                  </Text>
                </View>
                {item.customername && (
                  <Text
                    numberOfLines={1}
                    style={[$.h7, $.text_muted, $.mt_05]}>
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
                    {backgroundColor: statusColor.bg},
                    item.status === 1100 ? [$.border, $.border_default] : {},
                  ]}>
                  <Text style={[$.h7, {color: statusColor.text}]} numberOfLines={1}>
                    {statusName}
                  </Text>
                </View>
                {item.type === OrderTypes.Return && (
                  <Text style={[$.h7, $.text_danger, $.mt_05]}>
                    Return
                  </Text>
                )}
              </View>
            </View>

            <View style={[$.mt_1, $.gap_1]}>
              {item.designcode && (
                <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                  <Text style={[$.h7, $.text_muted, {width: 70}]}>
                    Design :
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                    {item.designcode} - {item.productname}
                  </Text>
                </View>
              )}

              {item.skudesignattributestring && (
                <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                  <Text style={[$.h7, $.text_muted, {width: 70}]}>
                    SKU :
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[$.h7, $.text_plain, $.flex_1]}>
                    {item.skudesignattributestring}
                  </Text>

                  <Text style={[$.h5, $.font_weight_bold, $.text_plain]}>
                    {formatPrice(item.netprice)}
                  </Text>
                </View>
              )}

              {item.createdon && (
                <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                  <Text style={[$.h7, $.text_muted, {width: 70}]}>
                    Date :
                  </Text>
                  <Text style={[$.h7, $.text_plain, $.flex_1]}>
                    {formatDateGB(item.createdon)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      keyExtractor={keyExtractor}
      contentContainerStyle={listContainerStyle}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}
