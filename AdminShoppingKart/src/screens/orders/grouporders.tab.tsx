import React, {useMemo} from 'react';
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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {OrderGroupGetWithDetailsRes} from '../../models/orders.model';
import {OrderShipmentGroup} from '../../models/ordershipmentgroup.model';
import {HomeTabParamList} from '../../hometab.navigation';
import {AppStackParamList} from '../../appstack.navigation';
import {Colors, $, ColorPalette} from '../../styles';
import {formatDateGB} from '../../utils/date.utils';

type GroupOrdersTabNavigationProp = BottomTabNavigationProp<HomeTabParamList>;
type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export type GroupOrdersTabProps = {
  data: OrderGroupGetWithDetailsRes[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onRefresh: () => void;
  keyExtractor: (item: OrderGroupGetWithDetailsRes) => string;
  listContainerStyle?: StyleProp<ViewStyle>;
};

// Separate component for OrderGroupCard to allow hooks
function OrderGroupCard({item, navigation, appNavigation}: {item: OrderGroupGetWithDetailsRes; navigation: GroupOrdersTabNavigationProp; appNavigation: AppNavigationProp}) {
  const products = useMemo(() => {
      // Use sku_quantities instead of product_quantities
      // Format: "DesignCode - Colour: COLOR, Size: SIZE (qty qty)"
      // Example: "0076 - Colour: NAVY, Size: XL (1 qty), 2977-GREY - Colour: GREY, Size: M (1 qty)"
      if (!item.sku_quantities) return [];
      
      // Split by "), " to separate records (each record ends with "(qty qty), ")
      // This avoids splitting on commas inside the format
      const records = item.sku_quantities.split(/\)\s*,\s*/).filter(r => r.trim());
      
      return records.map(p => {
        // Add back the closing parenthesis if it was removed by split
        let trimmed = p.trim();
        if (!trimmed.endsWith(')')) {
          trimmed = trimmed + ')';
        }
        
        // Extract quantity from "(qty qty)" format
        const qtyMatch = trimmed.match(/\((\d+)\s*qty\)/);
        const qty = qtyMatch ? qtyMatch[1] : '';
        
        // Remove quantity part to get the rest
        const withoutQty = trimmed.replace(/\s*\(\d+\s*qty\)\s*$/, '').trim();
        
        // Extract DesignCode (everything before " - ")
        const designCodeMatch = withoutQty.match(/^([^-]+)/);
        const designCode = designCodeMatch ? designCodeMatch[1].trim() : withoutQty;
        
        // Extract Colour (from "Colour: COLOR")
        const colourMatch = withoutQty.match(/Colour:\s*([^,]+)/i);
        const color = colourMatch ? colourMatch[1].trim() : '-';
        
        // Extract Size (from "Size: SIZE")
        const sizeMatch = withoutQty.match(/Size:\s*([^(]+)/i);
        const size = sizeMatch ? sizeMatch[1].trim() : '-';
        
        return {
          designCode: designCode,
          size: size,
          color: color,
          qty: qty || '-',
          raw: trimmed,
        };
      });
    }, [item.sku_quantities]);

  const shipments = useMemo(() => {
    // Use new shipments array (always present from server, may be empty)
    if (item.shipments && item.shipments.length > 0) {
      return item.shipments.map(shipment => {
        const statusName = shipment.status > 0 
          ? OrderShipmentGroup.getOrderShipmentGroupStatusName(shipment.status) 
          : 'Order Created';
        
        return {
          id: shipment.id.toString(),
          status: shipment.status,
          statusName: statusName || 'Order Created',
        };
      });
    }
    
    // Fallback to legacy comma-separated strings for backward compatibility
    // (in case server hasn't populated shipments yet or old API response)
    if (!item.shipmentgroupids || !item.shipment_statuses) return [];
    
    const ids = item.shipmentgroupids.split(', ').map(id => id.trim()).filter(id => id);
    const statuses = item.shipment_statuses.split(', ').map(s => s.trim()).filter(s => s);
    
    // Combine IDs and statuses into pairs
    return ids.map((id, index) => {
      const statusNum = statuses[index] ? parseInt(statuses[index]) : 0;
      const statusName = statusNum > 0 
        ? OrderShipmentGroup.getOrderShipmentGroupStatusName(statusNum) 
        : 'Order Created';
      
      return {
        id: id,
        status: statusNum,
        statusName: statusName || 'Order Created',
      };
    });
  }, [item.shipments, item.shipmentgroupids, item.shipment_statuses]);

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
                #{item.groupid} | Qty: {item.totalquantity} | {formatDateGB(item.orderdate)}
              </Text>
            </View>
            {item.customername && (
              <Text
                numberOfLines={1}
                style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]}>
                {item.customername} ( {item.mobilenumber} )
              </Text>
            )}
          </View>
        </View>

        <View style={[$.mt_1, $.gap_1]}>
          {products.length > 0 && (
            <View
              style={[
                $.mb_1,
                {
                  borderWidth: 1,
                  borderColor: Colors.divider,
                  borderRadius: 4,
                  overflow: 'hidden',
                },
              ]}>
              {/* Table Header */}
              <View
                style={[
                  $.flex_row,
                  {
                    backgroundColor: ColorPalette.backgroundSecondary,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.divider,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                  },
                ]}>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 2,
                    },
                  ]}>
                  Design Code
                </Text>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 1,
                      textAlign: 'center',
                    },
                  ]}>
                  Size
                </Text>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 1,
                      textAlign: 'center',
                    },
                  ]}>
                  Color
                </Text>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 0.8,
                      textAlign: 'right',
                    },
                  ]}>
                  Qty
                </Text>
              </View>
              
              {/* Table Rows */}
              {products.map((product, index) => (
                <View
                  key={index}
                  style={[
                    $.flex_row,
                    {
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderBottomWidth: index < products.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.divider,
                      backgroundColor: index % 2 === 0 ? Colors.background : ColorPalette.backgroundSecondary,
                    },
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 2,
                      },
                    ]}>
                    {product.designCode}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 1,
                        textAlign: 'center',
                      },
                    ]}>
                    {product.size}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 1,
                        textAlign: 'center',
                      },
                    ]}>
                    {product.color}
                  </Text>
                  <Text
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 0.8,
                        textAlign: 'right',
                      },
                    ]}>
                    {product.qty}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {item.total_shipments > 0 && shipments.length > 0 && (
            <View
              style={[
                $.mb_1,
                {
                  borderWidth: 1,
                  borderColor: Colors.divider,
                  borderRadius: 4,
                  overflow: 'hidden',
                },
              ]}>
              {/* Shipments Table Header */}
              <View
                style={[
                  $.flex_row,
                  {
                    backgroundColor: ColorPalette.backgroundSecondary,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.divider,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                  },
                ]}>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 1,
                    },
                  ]}>
                  Shipment ID
                </Text>
                <Text
                  style={[
                    $.h7,
                    $.font_weight_600,
                    {
                      color: Colors.text,
                      flex: 1,
                      textAlign: 'center',
                    },
                  ]}>
                  Status
                </Text>
              </View>
              
              {/* Shipments Table Rows */}
              {shipments.map((shipment, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    $.flex_row,
                    {
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderBottomWidth: index < shipments.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.divider,
                      backgroundColor: index % 2 === 0 ? Colors.background : ColorPalette.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    appNavigation.navigate('CreateShipment', {
                      ordergroupid: item.groupid,
                      ordershipmentgroupid: parseInt(shipment.id),
                      orderid: 0,
                    });
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 1,
                      },
                    ]}>
                    #{shipment.id}
                  </Text>
                  <Text
                    style={[
                      $.h7,
                      {
                        color: Colors.text,
                        flex: 1,
                        textAlign: 'center',
                      },
                    ]}>
                    {shipment.statusName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
}

export function GroupOrdersTab(props: GroupOrdersTabProps) {
  const {data, isLoading, hasActiveFilters, onClearFilters, onRefresh, keyExtractor, listContainerStyle} =
    props;
  const navigation = useNavigation<GroupOrdersTabNavigationProp>();
  const appNavigation = useNavigation<AppNavigationProp>();

  const renderOrderGroupCard = ({item}: {item: OrderGroupGetWithDetailsRes}) => (
    <OrderGroupCard item={item} navigation={navigation} appNavigation={appNavigation} />
  );

  if (isLoading && data.length === 0) {
    return (
      <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (data.length === 0) {
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
      data={data}
      renderItem={renderOrderGroupCard}
      keyExtractor={keyExtractor}
      contentContainerStyle={listContainerStyle}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}
