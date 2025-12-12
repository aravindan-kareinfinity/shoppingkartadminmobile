import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {Colors, $, ColorPalette} from '../styles';
import {HomeTabParamList} from '../hometab.navigation';
import {OrdersService} from '../services/orders.service';
import {
  Orders,
  OrderTypes,
  OrdersGroupByVendorReq,
  OrdersGroupByVendorRes,
  OrderGetWithDetailsReq,
  OrderGetWithDetailsRes,
} from '../models/orders.model';
import {CustomIcon, CustomIcons} from '../components/customicons.component';
import {BottomSheet} from '../components/bottomsheet.component';
import {FormInput} from '../components/forminput.component';
import {formatPrice} from '../utils/format.utils';
import {formatDateGB} from '../utils/date.utils';
import moment from 'moment';
import {DatePickerComponent} from '../components/datepicker.component';

type OrdersScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

export function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [ordersList, setOrdersList] = useState<OrderGetWithDetailsRes[]>([]);
  const [groupedOrdersList, setGroupedOrdersList] = useState<OrdersGroupByVendorRes[]>([]);
  const [filteredOrdersList, setFilteredOrdersList] = useState<OrdersGroupByVendorRes[]>([]);
  const [getall, setGetall] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Filter states
  const [filterFromDate, setFilterFromDate] = useState<Date | null>(null);
  const [filterToDate, setFilterToDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<number | null>(null); // null = All, specific status value = filter by status
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const ordersService = useRef(new OrdersService()).current;

  useEffect(() => {
    getGroupedData();
  }, [getall]);

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = [...groupedOrdersList];

    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const groupIdMatch = item.groupid.toString().includes(searchLower);
        const customerMatch = item.customername?.toLowerCase().includes(searchLower);
        return groupIdMatch || customerMatch;
      });
    }

    // Date range filter
    if (filterFromDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdon);
        return itemDate >= filterFromDate;
      });
    }
    if (filterToDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdon);
        // Set to end of day for comparison
        const toDateEnd = new Date(filterToDate);
        toDateEnd.setHours(23, 59, 59, 999);
        return itemDate <= toDateEnd;
      });
    }

    // Status filter - filter groups that contain orders with the selected status
    if (filterStatus !== null || showPendingOnly) {
      filtered = filtered.filter(group => {
        if (!group.design_status_list || group.design_status_list.length === 0) {
          return false;
        }
        
        if (showPendingOnly) {
          // Show groups that have at least one order with pending status (Placed, Confirmed, Picked, Checked, Packed)
          return group.design_status_list.some(design => 
            design.status === Orders.OrderStatuses.Placed ||
            design.status === Orders.OrderStatuses.Confirmed
          );
        } else if (filterStatus !== null) {
          // Show groups that have at least one order with the selected status
          return group.design_status_list.some(design => design.status === filterStatus);
        }
        
        return true;
      });
    }

    setFilteredOrdersList(filtered);
  }, [groupedOrdersList, searchText, filterFromDate, filterToDate, filterStatus, showPendingOnly]);

  const getGroupedData = async () => {
    setIsLoading(true);
    try {
      const request: OrdersGroupByVendorReq = {
        getall: getall,
        fromdate: filterFromDate || undefined,
        todate: filterToDate || undefined,
      };
      const groupedOrders = await ordersService.getGroupedByVendor(request);
      setGroupedOrdersList(groupedOrders);
    } catch (error) {
      console.error('Error fetching grouped orders:', error);
      setGroupedOrdersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setShowFilterSheet(false);
    getGroupedData();
  };

  const handleClearFilters = () => {
    setFilterFromDate(null);
    setFilterToDate(null);
    setFilterStatus(null);
    setShowPendingOnly(false);
    setSearchText('');
    setShowFilterSheet(false);
    getGroupedData();
  };

  const hasActiveFilters = filterFromDate || filterToDate || searchText.trim() || filterStatus !== null || showPendingOnly;

  const getData = async () => {
    setIsLoading(true);
    try {
      const request: OrderGetWithDetailsReq = {
        getall: getall,
      };
      const orders = await ordersService.getWithDetails(request);
      setOrdersList(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
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


  const calculateTotalQty = (item: OrdersGroupByVendorRes): number => {
    if (!item.design_status_list || item.design_status_list.length === 0) {
      return 0;
    }
    return item.design_status_list.reduce((sum, design) => sum + (design.qty || 0), 0);
  };

  const renderGroupedOrderItem = ({item}: {item: OrdersGroupByVendorRes}) => {
    const totalQty = calculateTotalQty(item);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          navigation.navigate('Scanner', {groupid: item.groupid});
        }}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={[$.h6, {color: Colors.textSecondary}]}>Group ID:</Text>
            <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.ml_2]}>
              {item.groupid}
            </Text>
          </View>
          {item.createdon && (
            <Text style={[$.h6, {color: Colors.textSecondary}]}>
              {formatDateGB(item.createdon)}
            </Text>
          )}
        </View>

        <View style={styles.orderContent}>
          <View style={styles.orderRow}>
            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
              Total Quantity:
            </Text>
            <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.flex_1]}>
              {totalQty}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({item}: {item: OrderGetWithDetailsRes}) => {
    const statusColor = getStatusColor(item.status, item.type || 0);
    const statusName = Orders.getOrderStatusName(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          // Navigate to order details if needed
          // navigation.navigate('OrderDetails', { orderid: item.id, groupid: item.groupid });
        }}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={[$.h6, {color: Colors.textSecondary}]}>ID:</Text>
            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.ml_1]}>
              {item.id}
            </Text>
            {item.groupid && (
              <>
                <Text style={[$.h6, {color: Colors.textSecondary}, $.ml_3]}>
                  Group:
                </Text>
                <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.ml_1]}>
                  {item.groupid}
                </Text>
              </>
            )}
          </View>
          {item.type === OrderTypes.Return && (
            <View style={styles.returnBadge}>
              <Text style={[$.h7, {color: Colors.background}]}>
                Return
              </Text>
            </View>
          )}
        </View>

        <View style={styles.orderContent}>
          {item.customername && (
            <View style={styles.orderRow}>
              <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
                Customer:
              </Text>
              <Text style={[$.h6, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                {item.customername}
              </Text>
            </View>
          )}

          {item.designcode && (
            <View style={styles.orderRow}>
              <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
                Design:
              </Text>
              <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.flex_1]}>
                {item.designcode}
              </Text>
            </View>
          )}

          {item.skudesignattributestring && (
            <View style={styles.orderRow}>
              <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
                SKU:
              </Text>
              <Text style={[$.h6, {color: Colors.text}, $.flex_1]}>
                {item.skudesignattributestring}
              </Text>
            </View>
          )}

          <View style={styles.orderRow}>
            <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
              Quantity:
            </Text>
            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.flex_1]}>
              {item.quantity}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
              Total:
            </Text>
            <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.flex_1]}>
              {formatPrice(item.netprice)}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
              Status:
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusColor.bg,
                  borderWidth: item.status === 1100 ? 1 : 0,
                  borderColor: Colors.divider,
                },
              ]}>
              <Text style={[$.h7, {color: statusColor.text}]}>
                {statusName}
              </Text>
            </View>
          </View>

          {item.createdon && (
            <View style={styles.orderRow}>
              <Text style={[$.h6, {color: Colors.textSecondary, width: 80}]}>
                Date:
              </Text>
              <Text style={[$.h6, {color: Colors.text}, $.flex_1]}>
                {formatDateGB(item.createdon)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <View style={[$.flex_1]}>
        {/* Header */}
        <View style={[styles.header, $.px_3, $.py_3]}>
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}]}>
            Orders
          </Text>
          <View style={styles.headerRight}>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={styles.loader}
              />
            )}
            <TouchableOpacity
              style={[styles.filterIconButton, hasActiveFilters && styles.filterIconButtonActive]}
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
          <View style={styles.searchContainer}>
            <CustomIcon name={CustomIcons.Search} color={Colors.textSecondary} size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by Group ID or Customer..."
              placeholderTextColor={Colors.textSecondary}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Grouped Orders List */}
        {isLoading && filteredOrdersList.length === 0 && groupedOrdersList.length === 0 ? (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredOrdersList.length === 0 ? (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
            <Text style={[$.h5, {color: Colors.textSecondary}]}>
              No orders found
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.clearFiltersButton, $.mt_3]}
                onPress={handleClearFilters}>
                <Text style={[$.h6, {color: Colors.primary}]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOrdersList}
            renderItem={renderGroupedOrderItem}
            keyExtractor={item => item.groupid.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={isLoading}
            onRefresh={getGroupedData}
          />
        )}

        {/* Filter Bottom Sheet */}
        <BottomSheet
          visible={showFilterSheet}
          onClose={() => setShowFilterSheet(false)}
          height="60%">
          <View style={styles.filterSheetContent}>
            <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}, $.mb_4]}>
              Filter Orders
            </Text>

            {/* Date Range - Single Row */}
            <View style={[$.mb_4]}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                Date Range
              </Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowFromDatePicker(true)}>
                    <Text style={[$.h6, {color: filterFromDate ? Colors.text : Colors.textSecondary}]}>
                      {filterFromDate ? formatDateGB(filterFromDate.toISOString()) : 'From Date'}
                    </Text>
                  </TouchableOpacity>
                  {filterFromDate && (
                    <TouchableOpacity
                      style={styles.clearFilterButton}
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
                <View style={styles.dateField}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowToDatePicker(true)}>
                    <Text style={[$.h6, {color: filterToDate ? Colors.text : Colors.textSecondary}]}>
                      {filterToDate ? formatDateGB(filterToDate.toISOString()) : 'To Date'}
                    </Text>
                  </TouchableOpacity>
                  {filterToDate && (
                    <TouchableOpacity
                      style={styles.clearFilterButton}
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
              <View style={[styles.statusToggleContainer, $.mb_3]}>
                <TouchableOpacity
                  style={[
                    styles.statusToggleButton,
                    !showPendingOnly && filterStatus === null && styles.statusToggleButtonActive,
                  ]}
                  onPress={() => {
                    setShowPendingOnly(false);
                    setFilterStatus(null);
                  }}>
                  <Text
                    style={[
                      styles.statusToggleText,
                      !showPendingOnly && filterStatus === null && styles.statusToggleTextActive,
                    ]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusToggleButton,
                    showPendingOnly && styles.statusToggleButtonActive,
                  ]}
                  onPress={() => {
                    setShowPendingOnly(true);
                    setFilterStatus(null);
                  }}>
                  <Text
                    style={[
                      styles.statusToggleText,
                      showPendingOnly && styles.statusToggleTextActive,
                    ]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Individual Status Options */}
              <View style={styles.statusOptionsContainer}>
                <Text style={[$.h7, {color: Colors.textSecondary}, $.mb_2]}>
                  Filter by Status:
                </Text>
                <View style={styles.statusOptionsGrid}>
                  {[
                    {label: 'Placed', value: Orders.OrderStatuses.Placed},
                    {label: 'Confirmed', value: Orders.OrderStatuses.Confirmed},
                    {label: 'Shipped', value: Orders.OrderStatuses.Shipped},
                  ].map((statusOption) => (
                    <TouchableOpacity
                      key={statusOption.value}
                      style={[
                        styles.statusOptionButton,
                        filterStatus === statusOption.value && styles.statusOptionButtonActive,
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
                          styles.statusOptionText,
                          filterStatus === statusOption.value && styles.statusOptionTextActive,
                        ]}>
                        {statusOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.clearButton]}
                onPress={handleClearFilters}>
                <Text style={[$.h5, $.font_weight_600, {color: Colors.text}]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.applyButton]}
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

// Using global styles - spacer = 8, so:
// 4 = spacer * 0.5, 8 = spacer, 12 = spacer * 1.5, 16 = spacer * 2
const spacer = 8;
const styles = StyleSheet.create({
  header: {
    ...$.flex_row,
    ...$.justify_content_spaceBetween,
    ...$.align_items_center,
    ...$.bg_background,
    ...$.border_bottom,
    borderBottomColor: Colors.divider,
  },
  headerRight: {
    ...$.flex_row,
    ...$.align_items_center,
    gap: spacer * 1.5, // 12
  },
  loader: $.mr_2,
  filterButtons: {
    ...$.flex_row,
    ...$.bg_inputbg,
    ...$.border_rounded_1,
    padding: 2,
    gap: spacer * 0.5, // 4
  },
  filterButton: {
    paddingVertical: 6,
    ...$.px_3,
    borderRadius: 6,
  },
  filterButtonActive: $.bg_primary,
  filterButtonText: {
    ...$.h6,
    ...$.text_muted,
    ...$.font_weight_500,
  },
  filterButtonTextActive: {
    color: Colors.background,
    ...$.font_weight_600,
  },
  listContainer: {
    ...$.p_3,
    gap: spacer * 1.5, // 12
  },
  orderCard: {
    ...$.bg_inputbg,
    ...$.border_rounded_2,
    ...$.p_4,
    marginBottom: 0,
    ...$.border,
    borderColor: Colors.divider,
  },
  orderHeader: {
    ...$.flex_row,
    ...$.justify_content_spaceBetween,
    ...$.align_items_center,
    ...$.mb_3,
    ...$.pb_3,
    ...$.border_bottom,
    borderBottomColor: Colors.divider,
  },
  orderIdContainer: {
    ...$.flex_row,
    ...$.align_items_center,
    ...$.flex_1,
  },
  returnBadge: {
    ...$.bg_primary,
    ...$.px_2,
    ...$.py_1,
    ...$.border_rounded,
  },
  orderContent: $.gap_2,
  orderRow: {
    ...$.flex_row,
    ...$.align_items_center,
    ...$.mb_1,
  },
  statusBadge: {
    ...$.px_2,
    ...$.py_1,
    ...$.border_rounded,
    ...$.align_self_start,
  },
  searchContainer: {
    ...$.flex_row,
    ...$.align_items_center,
    ...$.bg_inputbg,
    ...$.border_rounded_1,
    ...$.px_3,
    height: 44,
    ...$.border,
    borderColor: Colors.divider,
  },
  searchInput: {
    ...$.flex_1,
    ...$.ml_2,
    ...$.h5,
    color: Colors.text,
  },
  clearSearchButton: {
    ...$.p_1,
    ...$.ml_2,
  },
  clearText: {
    ...$.h4,
    ...$.text_muted,
  },
  filterIconButton: {
    ...$.p_2,
    ...$.mr_2,
    ...$.border_rounded_1,
  },
  filterIconButtonActive: $.bg_inputbg,
  filterSheetContent: $.flex_1,
  clearFilterButton: {
    ...$.mt_1,
    ...$.align_self_start,
  },
  dateRow: {
    ...$.flex_row,
    gap: spacer * 1.5, // 12
  },
  dateField: $.flex_1,
  datePickerButton: {
    ...$.border,
    ...$.border_rounded_1,
    ...$.px_3,
    ...$.py_2,
    borderColor: Colors.divider,
    backgroundColor: Colors.inputBackground,
    minHeight: 44,
    ...$.justify_content_center,
  },
  filterActions: {
    ...$.flex_row,
    gap: spacer * 1.5, // 12
    ...$.mt_4,
  },
  filterActionButton: {
    ...$.flex_1,
    paddingVertical: 14,
    ...$.border_rounded_1,
    ...$.align_items_center,
    ...$.justify_content_center,
  },
  clearButton: {
    ...$.bg_inputbg,
    ...$.border,
    borderColor: Colors.divider,
  },
  applyButton: {
    backgroundColor: Colors.textSecondary,
  },
  clearFiltersButton: {
    ...$.py_2,
    ...$.px_4,
    ...$.border_rounded_1,
    ...$.bg_inputbg,
  },
  statusToggleContainer: {
    ...$.flex_row,
    ...$.bg_inputbg,
    ...$.border_rounded_1,
    padding: 2,
    gap: spacer * 0.5, // 4
  },
  statusToggleButton: {
    ...$.flex_1,
    ...$.py_2,
    ...$.px_3,
    borderRadius: 6,
    ...$.align_items_center,
  },
  statusToggleButtonActive: {
    backgroundColor: Colors.textSecondary,
  },
  statusToggleText: {
    ...$.h6,
    ...$.text_muted,
    ...$.font_weight_500,
  },
  statusToggleTextActive: {
    color: Colors.background,
    ...$.font_weight_600,
  },
  statusOptionsContainer: $.mt_2,
  statusOptionsGrid: {
    ...$.flex_row,
    ...$.flex_wrap_wrap,
    ...$.gap_2,
  },
  statusOptionButton: {
    ...$.py_2,
    ...$.px_3,
    ...$.border_rounded_1,
    ...$.bg_inputbg,
    ...$.border,
    borderColor: Colors.divider,
    minWidth: 80,
    ...$.align_items_center,
  },
  statusOptionButtonActive: {
    backgroundColor: Colors.textSecondary,
    borderColor: Colors.textSecondary,
    borderWidth: 2,
  },
  statusOptionText: {
    ...$.h7,
    color: Colors.text,
    ...$.font_weight_500,
  },
  statusOptionTextActive: {
    color: Colors.background,
    ...$.font_weight_600,
  },
});

