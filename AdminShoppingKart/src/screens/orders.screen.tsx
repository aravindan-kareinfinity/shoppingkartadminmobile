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
  const [filterVendorId, setFilterVendorId] = useState<string>('');

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

    // Vendor ID filter
    if (filterVendorId.trim()) {
      // Note: vendorid is not in the response, so this would need to be added to the API response
      // For now, we'll skip this filter
    }

    setFilteredOrdersList(filtered);
  }, [groupedOrdersList, searchText, filterFromDate, filterToDate, filterVendorId]);

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
    setFilterVendorId('');
    setSearchText('');
    setShowFilterSheet(false);
    getGroupedData();
  };

  const hasActiveFilters = filterFromDate || filterToDate || filterVendorId.trim() || searchText.trim();

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

          {item.createdon && (
            <View style={styles.orderRow}>
              <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                Created On:
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
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  getall && styles.filterButtonActive,
                ]}
                onPress={() => setGetall(true)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    getall && styles.filterButtonTextActive,
                  ]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  !getall && styles.filterButtonActive,
                ]}
                onPress={() => setGetall(false)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    !getall && styles.filterButtonTextActive,
                  ]}>
                  Pending
                </Text>
              </TouchableOpacity>
            </View>
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

            {/* From Date */}
            <View style={$.mb_4}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                From Date (YYYY-MM-DD)
              </Text>
              <FormInput
                placeholder="e.g., 2024-01-01"
                value={filterFromDate ? moment(filterFromDate).format('YYYY-MM-DD') : ''}
                onChangeText={(text) => {
                  const date = moment(text, 'YYYY-MM-DD', true);
                  if (date.isValid()) {
                    setFilterFromDate(date.toDate());
                  } else if (text === '') {
                    setFilterFromDate(null);
                  }
                }}
                keyboardType="default"
              />
              {filterFromDate && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setFilterFromDate(null)}>
                  <Text style={[$.h6, {color: Colors.error}]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* To Date */}
            <View style={$.mb_4}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                To Date (YYYY-MM-DD)
              </Text>
              <FormInput
                placeholder="e.g., 2024-12-31"
                value={filterToDate ? moment(filterToDate).format('YYYY-MM-DD') : ''}
                onChangeText={(text) => {
                  const date = moment(text, 'YYYY-MM-DD', true);
                  if (date.isValid()) {
                    setFilterToDate(date.toDate());
                  } else if (text === '') {
                    setFilterToDate(null);
                  }
                }}
                keyboardType="default"
              />
              {filterToDate && (
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => setFilterToDate(null)}>
                  <Text style={[$.h6, {color: Colors.error}]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Vendor ID */}
            <View style={$.mb_4}>
              <Text style={[$.h6, {color: Colors.textSecondary}, $.mb_2]}>
                Vendor ID (Optional)
              </Text>
              <FormInput
                placeholder="Enter vendor ID"
                value={filterVendorId}
                onChangeText={setFilterVendorId}
                keyboardType="numeric"
              />
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loader: {
    marginRight: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  returnBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderContent: {
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  filterIconButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  filterIconButtonActive: {
    backgroundColor: Colors.inputBackground,
  },
  filterSheetContent: {
    flex: 1,
  },
  clearFilterButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  clearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
  },
});

