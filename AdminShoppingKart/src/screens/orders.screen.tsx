import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {Colors, $, ColorPalette} from '../styles';
import {HomeTabParamList} from '../hometab.navigation';
import {OrdersService} from '../services/orders.service';
import {Orders, OrderTypes, OrderGetWithDetailsReq, OrderGetWithDetailsRes, OrderGroupGetWithDetailsRes, OrderGetCustomerSummaryReq, OrderGetCustomerSummaryRes, GetWithDetailCustomerReq, GetWithDetailCustomerRes} from '../models/orders.model';
import {CustomIcon, CustomIcons} from '../components/customicons.component';
import {BottomSheet} from '../components/bottomsheet.component';
import {formatPrice} from '../utils/format.utils';
import {formatDateGB} from '../utils/date.utils';
import {DatePickerComponent} from '../components/datepicker.component';
import {DefaultOrdersTab} from './orders/defaultorders.tab';
import {GroupOrdersTab} from './orders/grouporders.tab';
import {CustomerOrdersTab} from './orders/customerorders.tab';

type OrdersScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

// Enum for tab titles - easily change titles here
enum OrdersTabTitles {
  Product = 'Item',
  Order = 'Order',
  Customer = 'Customer',
}

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const layout = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(false);
  const [defaultOrdersList, setDefaultOrdersList] = useState<OrderGetWithDetailsRes[]>([]);
  const [filteredDefaultOrders, setFilteredDefaultOrders] = useState<OrderGetWithDetailsRes[]>([]);
  const [groupedOrdersList, setGroupedOrdersList] = useState<OrderGroupGetWithDetailsRes[]>([]);
  const [filteredGroupedOrdersList, setFilteredGroupedOrdersList] = useState<OrderGroupGetWithDetailsRes[]>([]);
  const [customerOrdersList, setCustomerOrdersList] = useState<GetWithDetailCustomerRes[]>([]);
  const [filteredCustomerOrdersList, setFilteredCustomerOrdersList] = useState<GetWithDetailCustomerRes[]>([]);
  const [getall, setGetall] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    {key: 'default', title: OrdersTabTitles.Product},
    {key: 'group', title: OrdersTabTitles.Order},
    {key: 'customer', title: OrdersTabTitles.Customer},
  ]);
  
  // Filter states
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<number | null>(null); // null = All, specific status value = filter by status
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const ordersService = useRef(new OrdersService()).current;

  useEffect(() => {
    loadTabData(routes[tabIndex].key);
  }, [tabIndex, getall, filterFromDate, filterToDate, filterStatus, showPendingOnly]);

  // Filter orders based on search and filters
  useEffect(() => {
    const applyOrderFilters = (data: OrderGetWithDetailsRes[]) => {
      let filtered = [...data];

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(item => {
          const idMatch = item.id?.toString().includes(searchLower);
          const groupMatch = item.groupid?.toString().includes(searchLower);
        const customerMatch = item.customername?.toLowerCase().includes(searchLower);
          const designMatch = item.designcode?.toLowerCase().includes(searchLower);
          return idMatch || groupMatch || customerMatch || designMatch;
      });
    }

    if (filterFromDate) {
        filtered = filtered.filter(item => new Date(item.createdon) >= filterFromDate);
    }
    if (filterToDate) {
        const toDateEnd = new Date(filterToDate);
        toDateEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.createdon) <= toDateEnd);
    }

    if (filterStatus !== null || showPendingOnly) {
        filtered = filtered.filter(item => {
        if (showPendingOnly) {
            return (
              item.status === Orders.OrderStatuses.Placed ||
              item.status === Orders.OrderStatuses.Confirmed
          );
          }
          if (filterStatus !== null) {
            return item.status === filterStatus;
        }
        return true;
      });
    }

      return filtered;
    };

    const applyGroupOrderFilters = (data: OrderGroupGetWithDetailsRes[]) => {
      let filtered = [...data];

      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        filtered = filtered.filter(item => {
          const groupMatch = item.groupid?.toString().includes(searchLower);
          const customerMatch = item.customername?.toLowerCase().includes(searchLower);
          const mobileMatch = item.mobilenumber?.includes(searchLower);
          const productMatch = item.product_quantities?.toLowerCase().includes(searchLower);
          return groupMatch || customerMatch || mobileMatch || productMatch;
        });
      }

      if (filterFromDate) {
        filtered = filtered.filter(item => new Date(item.orderdate) >= filterFromDate);
      }
      if (filterToDate) {
        const toDateEnd = new Date(filterToDate);
        toDateEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.orderdate) <= toDateEnd);
      }

      // Group orders don't have status field, so skip status filtering
      return filtered;
    };

    const applyCustomerSummaryFilters = (data: GetWithDetailCustomerRes[]) => {
      let filtered = [...data];

      if (searchText.trim()) {
        const searchLower = searchText.toLowerCase().trim();
        filtered = filtered.filter(item => {
          const customerIdMatch = item.customerid?.toString().includes(searchLower);
          const customerMatch = item.customername?.toLowerCase().includes(searchLower);
          const mobileMatch = item.customermobilenumber?.includes(searchLower);
          const emailMatch = item.customeremail?.toLowerCase().includes(searchLower);
          return customerIdMatch || customerMatch || mobileMatch || emailMatch;
        });
      }

      if (filterFromDate) {
        filtered = filtered.filter(item => new Date(item.lastorderdate) >= filterFromDate);
      }
      if (filterToDate) {
        const toDateEnd = new Date(filterToDate);
        toDateEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.lastorderdate) <= toDateEnd);
      }

      // Customer summary doesn't have status field, so skip status filtering
      return filtered;
    };

    setFilteredDefaultOrders(applyOrderFilters(defaultOrdersList));
    setFilteredGroupedOrdersList(applyGroupOrderFilters(groupedOrdersList));
    setFilteredCustomerOrdersList(applyCustomerSummaryFilters(customerOrdersList));
  }, [
    groupedOrdersList,
    defaultOrdersList,
    customerOrdersList,
    searchText,
    filterFromDate,
    filterToDate,
    filterStatus,
    showPendingOnly,
  ]);

  const loadTabData = (key: string) => {
    if (key === 'default') {
      fetchDefaultOrders();
    } else if (key === 'group') {
      fetchGroupedOrders();
    } else if (key === 'customer') {
      fetchCustomerOrders();
    }
  };

  const fetchDefaultOrders = async () => {
    setIsLoading(true);
    try {
      const request: OrderGetWithDetailsReq = {
        getall: getall,
        fromdate: filterFromDate || undefined,
        todate: filterToDate || undefined,
        status: filterStatus !== null ? filterStatus : undefined,
      };
      const orders = await ordersService.getWithDetailsDefault(request);
      setDefaultOrdersList(orders);
    } catch (error) {
      console.error('Error fetching default orders:', error);
      setDefaultOrdersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupedOrders = async () => {
    setIsLoading(true);
    try {
      const request: OrderGetWithDetailsReq = {
        getall: getall,
        fromdate: filterFromDate || undefined,
        todate: filterToDate || undefined,
        status: filterStatus !== null ? filterStatus : undefined,
      };
      const orders = await ordersService.getWithDetailsGroup(request);
      setGroupedOrdersList(orders);
    } catch (error) {
      console.error('Error fetching grouped orders:', error);
      setGroupedOrdersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    setIsLoading(true);
    try {
      const request: GetWithDetailCustomerReq = {
        getall: getall,
        fromdate: filterFromDate || undefined,
        todate: filterToDate || undefined,
        status: filterStatus !== null ? filterStatus : undefined,
        pendingonly: showPendingOnly || undefined,
      };
      const orders = await ordersService.getWithDetailCustomer(request);
      setCustomerOrdersList(orders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrdersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setShowFilterSheet(false);
    loadTabData(routes[tabIndex].key);
  };

  const handleClearFilters = () => {
    setFilterFromDate(null);
    setFilterToDate(null);
    setFilterStatus(null);
    setShowPendingOnly(false);
    setSearchText('');
    setShowFilterSheet(false);
    loadTabData(routes[tabIndex].key);
  };

  const hasActiveFilters = !!(
    filterFromDate ||
    filterToDate ||
    searchText.trim() ||
    filterStatus !== null ||
    showPendingOnly
  );

  const listContainerStyle = StyleSheet.flatten([$.p_3, {gap: 12}]);

  const renderScene = SceneMap({
    default: () => (
      <DefaultOrdersTab
        data={filteredDefaultOrders}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onRefresh={fetchDefaultOrders}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        listContainerStyle={listContainerStyle}
      />
    ),
    group: () => (
      <GroupOrdersTab
        data={filteredGroupedOrdersList}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onRefresh={fetchGroupedOrders}
        keyExtractor={item => item.groupid?.toString() || Math.random().toString()}
        listContainerStyle={listContainerStyle}
      />
    ),
    customer: () => (
      <CustomerOrdersTab
        data={filteredCustomerOrdersList}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onRefresh={fetchCustomerOrders}
        keyExtractor={item => item.customerid?.toString() || Math.random().toString()}
        listContainerStyle={listContainerStyle}
      />
    ),
  });

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <View style={[$.flex_1]}>
        {/* Header */}
        <View
          style={[
            $.flex_row,
            $.justify_content_spaceBetween,
            $.align_items_center,
            $.bg_background,
            $.border_bottom,
            $.px_3,
            $.py_3,
            {borderBottomColor: Colors.divider},
          ]}>
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}]}>
            Orders
          </Text>
          <View style={[$.flex_row, $.align_items_center, {gap: 12}]}>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={$.mr_2}
              />
            )}
            <TouchableOpacity
              style={[
                $.p_2,
                $.mr_2,
                $.border_rounded_1,
                hasActiveFilters && $.bg_inputbg,
              ]}
              onPress={() => setShowFilterSheet(true)}>
              <CustomIcon 
                name={CustomIcons.Filter} 
                color={hasActiveFilters ? Colors.primary : Colors.text} 
                size={24} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[$.px_3, $.py_2]}>
          <View
            style={[
              $.flex_row,
              $.align_items_center,
              $.bg_inputbg,
              $.border_rounded_1,
              $.px_3,
              $.border,
              {height: 44, borderColor: Colors.divider},
            ]}>
            <CustomIcon name={CustomIcons.Search} color={Colors.textSecondary} size={20} />
            <TextInput
              style={[$.flex_1, $.ml_2, $.h5, {color: Colors.text}]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by Group ID or Customer..."
              placeholderTextColor={Colors.textSecondary}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={[$.p_1, $.ml_2]}>
                <Text style={[$.h4, $.text_muted]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TabView
          navigationState={{index: tabIndex, routes}}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
          initialLayout={{width: layout.width}}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{backgroundColor: Colors.primary}}
              style={{backgroundColor: Colors.background}}
              activeColor={Colors.primary}
              inactiveColor={Colors.textSecondary}
          />
        )}
        />

        {/* Filter Bottom Sheet */}
        <BottomSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          height="60%">
          <View style={$.flex_1}>
            <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}, $.mb_4]}>
              Filter Orders
            </Text>

            {/* Date Range - Single Row */}
            <View style={[$.mb_4]}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                Date Range
              </Text>
              <View style={[ $.flex_row, {gap: 12}]}>
                <View style={$.flex_1}>
                  <TouchableOpacity
                    style={[
                      $.border,
                      $.border_rounded_1,
                      $.px_3,
                      $.py_2,
                      $.justify_content_center,
                      {
                        borderColor: Colors.divider,
                        backgroundColor: Colors.inputBackground,
                        minHeight: 44,
                      },
                    ]}
                    onPress={() => setShowFromDatePicker(true)}>
                    <Text style={[$.h6, {color: filterFromDate ? Colors.text : Colors.textSecondary}]}>
                      {filterFromDate ? formatDateGB(filterFromDate.toISOString()) : 'From Date'}
                    </Text>
                  </TouchableOpacity>
                  {filterFromDate && (
                    <TouchableOpacity
                      style={[ $.mt_1, $.align_self_start]}
                      onPress={() => setFilterFromDate(null)}>
                      <Text style={[$.h7, {color: Colors.error}]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <DatePickerComponent
                    date={filterFromDate || new Date()}
                    show={showFromDatePicker}
                    mode="date"
                    setShow={setShowFromDatePicker}
                    setDate={(date) => {
                      setFilterFromDate(date);
                      setShowFromDatePicker(false);
                    }}
                    disablePrevious={false}
                  />
                </View>
                <View style={$.flex_1}>
                  <TouchableOpacity
                    style={[
                      $.border,
                      $.border_rounded_1,
                      $.px_3,
                      $.py_2,
                      $.justify_content_center,
                      {
                        borderColor: Colors.divider,
                        backgroundColor: Colors.inputBackground,
                        minHeight: 44,
                      },
                    ]}
                    onPress={() => setShowToDatePicker(true)}>
                    <Text style={[$.h6, {color: filterToDate ? Colors.text : Colors.textSecondary}]}>
                      {filterToDate ? formatDateGB(filterToDate.toISOString()) : 'To Date'}
                    </Text>
                  </TouchableOpacity>
                  {filterToDate && (
                    <TouchableOpacity
                      style={[ $.mt_1, $.align_self_start]}
                      onPress={() => setFilterToDate(null)}>
                      <Text style={[$.h7, {color: Colors.error}]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <DatePickerComponent
                    date={filterToDate || new Date()}
                    show={showToDatePicker}
                    mode="date"
                    setShow={setShowToDatePicker}
                    setDate={(date) => {
                      setFilterToDate(date);
                      setShowToDatePicker(false);
                    }}
                    disablePrevious={false}
                  />
                </View>
              </View>
            </View>

            {/* Status Filter */}
            <View style={$.mb_4}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                Order Status
              </Text>
              
              {/* All / Pending Toggle */}
              <View
                style={[
                  $.flex_row,
                  $.bg_inputbg,
                  $.border_rounded_1,
                  $.mb_3,
                  {padding: 2, gap: 4},
                ]}>
                <TouchableOpacity
                  style={[
                    $.flex_1,
                    $.py_2,
                    $.px_3,
                    $.align_items_center,
                    {
                      borderRadius: 6,
                      backgroundColor:
                        !showPendingOnly && filterStatus === null
                          ? Colors.textSecondary
                          : undefined,
                    },
                  ]}
                  onPress={() => {
                    setShowPendingOnly(false);
                    setFilterStatus(null);
                  }}>
                  <Text
                    style={[
                      $.h6,
                      $.text_muted,
                      $.font_weight_500,
                      !showPendingOnly &&
                        filterStatus === null && {
                          color: Colors.background,
                          ...$.font_weight_600,
                        },
                    ]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    $.flex_1,
                    $.py_2,
                    $.px_3,
                    $.align_items_center,
                    {
                      borderRadius: 6,
                      backgroundColor: showPendingOnly
                        ? Colors.textSecondary
                        : undefined,
                    },
                  ]}
                  onPress={() => {
                    setShowPendingOnly(true);
                    setFilterStatus(null);
                  }}>
                  <Text
                    style={[
                      $.h6,
                      $.text_muted,
                      $.font_weight_500,
                      showPendingOnly && {
                        color: Colors.background,
                        ...$.font_weight_600,
                      },
                    ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Individual Status Options */}
              <View style={$.mt_2}>
                <Text style={[$.h7, {color: Colors.textSecondary}, $.mb_2]}>
                  Filter by Status:
                </Text>
                <View style={[$.flex_row, $.flex_wrap_wrap, $.gap_2]}>
                  {[
                    {label: 'Placed', value: Orders.OrderStatuses.Placed},
                    {label: 'Confirmed', value: Orders.OrderStatuses.Confirmed},
                    {label: 'Shipped', value: Orders.OrderStatuses.Shipped},
                  ].map((statusOption) => (
                    <TouchableOpacity
                      key={statusOption.value}
                      style={[
                        $.py_2,
                        $.px_3,
                        $.border_rounded_1,
                        $.bg_inputbg,
                        $.border,
                        $.align_items_center,
                        {
                          minWidth: 80,
                          borderColor: Colors.divider,
                          ...(filterStatus === statusOption.value && {
                            backgroundColor: Colors.textSecondary,
                            borderColor: Colors.textSecondary,
                            borderWidth: 2,
                          }),
                        },
                      ]}
                      onPress={() => {
                        if (filterStatus === statusOption.value) {
                          setFilterStatus(null);
                          setShowPendingOnly(false);
                        } else {
                          setFilterStatus(statusOption.value);
                          setShowPendingOnly(false);
                        }
                      }}>
                      <Text
                        style={[
                          $.h7,
                          $.font_weight_500,
                          {color: Colors.text},
                          filterStatus === statusOption.value && {
                            color: Colors.background,
                            ...$.font_weight_600,
                          },
                        ]}>
                        {statusOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[ $.flex_row, $.mt_4, {gap: 12}]}>
              <TouchableOpacity
                style={[
                  $.flex_1,
                  $.border_rounded_1,
                  $.align_items_center,
                  $.justify_content_center,
                  $.bg_inputbg,
                  $.border,
                  {paddingVertical: 14, borderColor: Colors.divider},
                ]}
                onPress={handleClearFilters}>
                <Text style={[$.h5, $.font_weight_600, {color: Colors.text}]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  $.flex_1,
                  $.border_rounded_1,
                  $.align_items_center,
                  $.justify_content_center,
                  {paddingVertical: 14, backgroundColor: Colors.textSecondary},
                ]}
                onPress={handleApplyFilters}>
                <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}

