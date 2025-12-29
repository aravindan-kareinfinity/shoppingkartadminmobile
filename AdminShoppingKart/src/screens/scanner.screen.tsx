// NOTE: This is a recreated version based on chat references
// The original file was 1626 lines. This version includes the core functionality.
// You may need to install additional dependencies: axios, @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs

import React, {useState, useEffect, useCallback, useRef, Suspense} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../appstack.navigation';
import {Camera} from 'react-native-camera-kit';
import {HomeTabParamList} from '../hometab.navigation';
import {Colors, $, ColorPalette} from '../styles';
import {FormInput} from '../components/forminput.component';
import {CustomIcon, CustomIcons} from '../components/customicons.component';
import {OrdersService} from '../services/orders.service';
import {
  OrderGetWithDetailsReq,
  OrderGetWithDetailsRes,
  OrderAdminPanelOrderSummaryRes,
  OrderAdminPanelOrderDetailsV3StatusRes,
  OrderGroupAdminPanelOrderSummaryV3Res,
} from '../models/orders.model';
import {OrderGroupService} from '../services/ordergroup.service';
import {OrderTypes, Orders, getOrderStatusName, getOrderStatusColor} from '../models/orders.model';
import {OrderShipmentGroupStatus} from '../models/ordershipmentgroup.model';
import {SkuBarcodeMapService} from '../services/skubarcodemap.service';
import {UsersService} from '../services/users.service';
import {environment} from '../utils/environment';
import {useAppSelector} from '../redux/hooks.redux';
import {selectenvironment} from '../redux/environment.redux';
import {formatDate, formatDateTime} from '../utils/date.utils';
import {formatPrice} from '../utils/format.utils';
import {BottomSheet} from '../components/bottomsheet.component';

type ScannerScreenRouteProp = RouteProp<HomeTabParamList, 'Scanner'>;
type ScannerScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;
type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export function ScannerScreen() {
  const route = useRoute<ScannerScreenRouteProp>();
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const appNavigation = useNavigation<AppNavigationProp>();
  const environmentState = useAppSelector(selectenvironment);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderGetWithDetailsRes[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderAdminPanelOrderSummaryRes | null>(null);
  const [orderGroupSummary, setOrderGroupSummary] = useState<OrderGroupAdminPanelOrderSummaryV3Res | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchMode, setSearchMode] = useState<'barcode' | 'orderid' | 'ordergroupid'>('barcode');
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [orderStatusData, setOrderStatusData] = useState<OrderAdminPanelOrderDetailsV3StatusRes | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  const ordersService = useRef(new OrdersService()).current;
  const orderGroupService = useRef(new OrderGroupService()).current;
  const skuBarcodeMapService = useRef(new SkuBarcodeMapService()).current;
  const usersService = useRef(new UsersService()).current;

  // Track if we've already loaded the groupid to prevent infinite loops
  const hasLoadedGroupId = useRef<number | null>(null);
  // Track the current groupid we're viewing to check if we should refresh
  const currentGroupIdRef = useRef<number | null>(null);
  // Track if we've refreshed on this focus to prevent continuous refreshes
  const hasRefreshedOnFocus = useRef<boolean>(false);

  // Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'We need your permission to use your camera to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasCameraPermission(true);
          setShowQRScanner(true);
          return true;
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      // iOS permissions are handled automatically by the library
      setHasCameraPermission(true);
      setShowQRScanner(true);
      return true;
    }
  };

  const isNumeric = (str: string): boolean => {
    return /^\d+$/.test(str.trim());
  };

  const searchByOrderGroupId = useCallback(async (groupId: number) => {
    try {
      console.log('🔍 Searching by Order Group ID:', groupId);
      setIsLoading(true);
      setSearchPerformed(true);
      setOrders([]);
      setOrderSummary(null);
      setOrderGroupSummary(null);
      
      const groupSummary = await orderGroupService.adminPanelOrderSummaryV3({ordergroupid: groupId});
      console.log('✅ Order Group API Response:', groupSummary);
      
      if (!groupSummary || !groupSummary.ordergroup || groupSummary.ordergroup.ordergroupid <= 0) {
        console.log('❌ Order group not found or invalid');
        Alert.alert('Error', 'Order group not found');
        return false;
      }
      
      setOrderGroupSummary(groupSummary);
      setOrderSummary(null);
      setOrders([]);
      setSearchMode('ordergroupid');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('❌ Error fetching order group:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      Alert.alert('Error', error?.message || 'Failed to load order group details');
    } finally {
      setIsLoading(false);
    }
    return false;
  }, [orderGroupService]);

  const searchByBarcodeWithText = useCallback(async (text: string) => {
    if (!text.trim()) {
      console.log('❌ Empty search text');
      Alert.alert('Error', 'Please enter a barcode or order ID');
      return;
    }

    console.log('🔍 Starting search with text:', text);
    setIsLoading(true);
    setSearchPerformed(true);
    setOrders([]);
    setOrderSummary(null);
    setOrderGroupSummary(null);

    try {
      // Step 1: Check if it's a numeric value (could be ordergroupid)
      if (isNumeric(text)) {
        const numValue = parseInt(text.trim());
        console.log('🔍 Text is numeric, trying as Order Group ID:', numValue);
        
        // Try as order group ID
        const foundAsGroupId = await searchByOrderGroupId(numValue);
        if (foundAsGroupId) {
          console.log('✅ Found as Order Group ID');
          setIsLoading(false);
          return;
        }
        console.log('❌ Not found as Order Group ID, trying barcode search');
      }

      // Step 2: If not numeric or not found, try barcode search
      console.log('🔍 Searching by barcode:', text.trim());
      const barcodeMaps = await skuBarcodeMapService.searchByBarcode(text.trim());
      console.log('✅ Barcode search result:', barcodeMaps);

      if (!barcodeMaps || barcodeMaps.length === 0) {
        console.log('❌ No barcode maps found');
        Alert.alert('Not Found', 'No order or SKU found for this search');
        setIsLoading(false);
        return;
      }

      // Step 3: Get all unique SKU IDs from barcode maps
      const skuIds = [...new Set(barcodeMaps.map(map => map.skuid))];
      console.log('🔍 Found SKU IDs:', skuIds);

      // Step 4: Search orders by SKU IDs
      const allOrders: OrderGetWithDetailsRes[] = [];
      
      for (const skuId of skuIds) {
        const orderReq: OrderGetWithDetailsReq = {
          getall: false,
          skuid: skuId,
        };
        console.log('🔍 Fetching orders for SKU ID:', skuId);
        const ordersForSku = await ordersService.getWithDetailsDefault(orderReq);
        console.log('✅ Found orders for SKU:', ordersForSku.length);
        allOrders.push(...ordersForSku);
      }

      // Remove duplicates and sort by created date (newest first)
      const uniqueOrders = allOrders.filter(
        (order, index, self) =>
          index === self.findIndex(o => o.id === order.id),
      );
      uniqueOrders.sort(
        (a, b) =>
          new Date(b.createdon).getTime() - new Date(a.createdon).getTime(),
      );

      console.log('✅ Total unique orders found:', uniqueOrders.length);
      setOrders(uniqueOrders);
      setSearchMode('barcode');

      if (uniqueOrders.length === 0) {
        Alert.alert('No Orders', 'No orders found for this barcode');
      }
    } catch (error: any) {
      console.error('❌ Error searching:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      Alert.alert(
        'Error',
        error?.message || 'Failed to search. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [ordersService, skuBarcodeMapService, searchByOrderGroupId]);

  const handleQRScan = useCallback(
    async (event: any) => {
      const scannedCode = event.nativeEvent.codeStringValue;
      console.log('Scanned QR Code:', scannedCode);

      // Close scanner
      setShowQRScanner(false);
      setHasCameraPermission(false);

      // Set the scanned code as search text and search
      setSearchText(scannedCode);
      await searchByBarcodeWithText(scannedCode);
    },
    [searchByBarcodeWithText],
  );

  // Function to load order group data
  const loadOrderGroupData = useCallback(async (groupid: number) => {
    try {
      setIsLoading(true);
      setSearchPerformed(true);
      setOrders([]);
      setOrderSummary(null);
      
      const groupSummary = await orderGroupService.adminPanelOrderSummaryV3({ordergroupid: groupid});
      
      if (!groupSummary || !groupSummary.ordergroup || groupSummary.ordergroup.ordergroupid <= 0) {
        Alert.alert('Error', 'Order group not found');
        return false;
      }
      
      setOrderGroupSummary(groupSummary);
      setOrderSummary(null);
      setOrders([]);
      setSearchMode('ordergroupid');
      currentGroupIdRef.current = groupid;
      return true;
    } catch (error: any) {
      console.error('Error fetching order group:', error);
      
      // Don't show alert for 401 - it's handled by interceptor
      const statusCode = error?.response?.status;
      if (statusCode === 401) {
        console.log('401 Unauthorized - stopping retries');
        setIsLoading(false);
        return false;
      }
      
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to load order group details');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [orderGroupService]);

  // Auto-search when groupid is passed via route params
  useEffect(() => {
    const groupid = route.params?.groupid;
    // Only load if groupid exists, is valid, and hasn't been loaded yet
    if (groupid && groupid > 0 && hasLoadedGroupId.current !== groupid) {
      hasLoadedGroupId.current = groupid;
      setSearchText(groupid.toString());
      loadOrderGroupData(groupid);
    }
    
    // Reset when groupid is cleared
    if (!groupid || groupid <= 0) {
      hasLoadedGroupId.current = null;
      currentGroupIdRef.current = null;
      hasRefreshedOnFocus.current = false;
    }
  }, [route.params?.groupid, loadOrderGroupData]);

  // Reload data when screen comes into focus (e.g., when returning from create shipment)
  useFocusEffect(
    useCallback(() => {
      const groupid = route.params?.groupid;
      
      // If we have a groupid and it matches the one we're currently viewing, refresh it once
      // This ensures new shipments show up when returning from create shipment screen
      if (groupid && groupid > 0 && currentGroupIdRef.current === groupid && !hasRefreshedOnFocus.current) {
        console.log('🔄 Screen focused - refreshing order group data');
        hasRefreshedOnFocus.current = true;
        // Use a small delay to avoid conflicts with other navigation events
        const timeoutId = setTimeout(() => {
          loadOrderGroupData(groupid).then(() => {
            // Reset after a delay to allow refresh on next focus
            setTimeout(() => {
              hasRefreshedOnFocus.current = false;
            }, 2000);
          });
        }, 500);
        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        // Reset flag if groupid doesn't match or we don't have one
        hasRefreshedOnFocus.current = false;
      }
    }, [route.params?.groupid, loadOrderGroupData])
  );

  const searchByBarcode = async () => {
    if (!searchText.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }
    console.log('🔍 Starting search with text:', searchText);
    await searchByBarcodeWithText(searchText);
  };

  const handleSearchSubmit = () => {
    console.log('🔍 Search submitted via keyboard');
    searchByBarcode();
  };

  const handleOpenQRScanner = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }
  };

  const getImageUrl = (fileid?: number): string => {
    if (!fileid) return '';
    const baseurl = environmentState.url || environment.baseurl;
    return `${baseurl}/api/Files/get?id=${fileid}`;
  };

  // Status management functions
  const handleMoveToNextStatus = async () => {
    if (!orderStatusData) return;

    try {
      setIsUpdatingStatus(true);
      
      if (orderStatusData.orderstatus === Orders.OrderStatuses.Placed) {
        await usersService.OrderConfirm({
          orderid: orderStatusData.orderid,
          notes: statusNotes || '',
        });
      }
      
      // Refresh data
      if (orderGroupSummary?.ordergroup.ordergroupid) {
        const refreshedGroupSummary = await orderGroupService.adminPanelOrderSummaryV3({
          ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
        });
        if (refreshedGroupSummary && refreshedGroupSummary.ordergroup.ordergroupid > 0) {
          setOrderGroupSummary(refreshedGroupSummary);
        }
      }
      
      const updatedStatus = await ordersService.adminPanelOrderDetailsV3Status({
        orderid: orderStatusData.orderid,
      });
      
      if (updatedStatus && updatedStatus.orderid > 0) {
        setOrderStatusData(updatedStatus);
        setStatusNotes('');
        Alert.alert('Success', 'Order status updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', error?.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderStatusData) return;

    try {
      setIsCanceling(true);
      await usersService.OrderRefundAndCancel({
        orderid: orderStatusData.orderid,
        notes: '',
      });
      
      const updatedStatus = await ordersService.adminPanelOrderDetailsV3Status({
        orderid: orderStatusData.orderid,
      });
      
      if (updatedStatus && updatedStatus.orderid > 0) {
        setOrderStatusData(updatedStatus);
        
        if (orderGroupSummary?.ordergroup.ordergroupid) {
          const refreshedGroupSummary = await orderGroupService.adminPanelOrderSummaryV3({
            ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
          });
          if (refreshedGroupSummary && refreshedGroupSummary.ordergroup.ordergroupid > 0) {
            setOrderGroupSummary(refreshedGroupSummary);
          }
        }
        
        Alert.alert('Success', 'Order cancelled successfully');
      }
    } catch (error: any) {
      console.error('Error canceling order:', error);
      Alert.alert('Error', error?.message || 'Failed to cancel order');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleConfirmAllPlacedOrders = async () => {
    if (!orderGroupSummary?.orderlist) return;

    // Filter orders with Placed status
    const placedOrders = orderGroupSummary.orderlist.filter(
      order => order.orderstatus === Orders.OrderStatuses.Placed
    );

    if (placedOrders.length === 0) {
      Alert.alert('Info', 'No orders with Placed status to confirm');
      return;
    }

    try {
      setIsConfirmingAll(true);
      let successCount = 0;
      let failCount = 0;

      // Confirm each order
      for (const order of placedOrders) {
        try {
          await usersService.OrderConfirm({
            orderid: order.orderid,
            notes: 'Bulk confirmed',
          });
          successCount++;
        } catch (error: any) {
          console.error(`Error confirming order ${order.orderid}:`, error);
          failCount++;
        }
      }

      // Refresh order group summary
      if (orderGroupSummary.ordergroup.ordergroupid) {
        const refreshedGroupSummary = await orderGroupService.adminPanelOrderSummaryV3({
          ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
        });
        if (refreshedGroupSummary && refreshedGroupSummary.ordergroup.ordergroupid > 0) {
          setOrderGroupSummary(refreshedGroupSummary);
        }
      }

      if (failCount === 0) {
        Alert.alert('Success', `Successfully confirmed ${successCount} order(s)`);
      } else {
        Alert.alert(
          'Partial Success',
          `Confirmed ${successCount} order(s), ${failCount} failed`
        );
      }
    } catch (error: any) {
      console.error('Error confirming all orders:', error);
      Alert.alert('Error', error?.message || 'Failed to confirm orders');
    } finally {
      setIsConfirmingAll(false);
    }
  };

  const handleViewOrderStatus = async (orderId: number) => {
    try {
      console.log('🔍 Opening bottom sheet for order:', orderId);
      // Open sheet immediately so user sees it opening
      setShowStatusSheet(true);
      setLoadingStatus(true);
      setOrderStatusData(null); // Clear previous data
      
      const statusData = await ordersService.adminPanelOrderDetailsV3Status({
        orderid: orderId,
      });
      
      console.log('✅ Order status data received:', statusData);
      
      if (statusData && statusData.orderid > 0) {
        setOrderStatusData(statusData);
      } else {
        Alert.alert('Error', 'Failed to load order status');
        setShowStatusSheet(false);
      }
    } catch (error: any) {
      console.error('❌ Error fetching order status:', error);
      Alert.alert('Error', error?.message || 'Failed to load order status');
      setShowStatusSheet(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Render functions (simplified - add full rendering logic as needed)
  const renderOrderItem = ({item}: {item: OrderGetWithDetailsRes}) => {
    const statusColor = getOrderStatusColor(item.status);
    const statusName = getOrderStatusName(item.status);
    
    return (
      <TouchableOpacity
        style={[
          $.bg_background,
          $.p_3,
          $.mb_3,
          $.border_rounded_1,
          $.border,
          $.border_default,
        ]}
        onPress={async () => {
          try {
            setIsLoading(true);
            const summary = await ordersService.adminPanelOrderSummary({orderid: item.id});
            if (summary && summary.orderid > 0) {
              setOrderSummary(summary);
              setOrders([]);
              setSearchMode('orderid');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to load order details');
          } finally {
            setIsLoading(false);
          }
        }}>
        <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_2]}>
          <Text style={[$.h4, $.font_weight_bold, $.text_plain]}>#{item.id}</Text>
          <View style={[$.px_2, $.py_1, $.border_rounded, {backgroundColor: statusColor.bg}]}>
            <Text style={[$.h7, $.font_weight_600, {color: statusColor.text}]}>
              {statusName}
            </Text>
          </View>
        </View>
        <Text style={[$.h5, $.font_weight_600, $.text_plain, $.mb_1]}>{item.designcode || 'N/A'}</Text>
        <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center]}>
          <Text style={[$.h4, $.font_weight_bold, $.text_primary]}>₹{item.netprice.toFixed(2)}</Text>
          <Text style={[$.h6, $.text_muted]}>Qty: {item.quantity}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Show QR Scanner
  if (showQRScanner && hasCameraPermission) {
    return (
      <SafeAreaView style={[$.flex_1, $.bg_background]}>
        <View style={[$.flex_1, {backgroundColor: '#000'}]}>
          <View style={[
            $.flex_row,
            $.justify_content_spaceBetween,
            $.align_items_center,
            $.p_4,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
            }
          ]}>
            <TouchableOpacity
              style={[
                {width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)'},
                $.justify_content_center,
                $.align_items_center,
              ]}
              onPress={() => {
                setShowQRScanner(false);
                setHasCameraPermission(false);
              }}>
              <CustomIcon name={CustomIcons.Close} color={Colors.background} size={24} />
            </TouchableOpacity>
            <Text style={[$.h4, $.font_weight_bold, $.text_white]}>
              Scan QR Code
            </Text>
            <View style={{width: 24}} />
          </View>
          <Suspense fallback={
            <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[$.mt_3, $.text_muted]}>Loading camera...</Text>
            </View>
          }>
            <Camera
              style={{flex: 1}}
              scanBarcode={true}
              laserColor={'#FF0000'}
              frameColor={'#00FF00'}
              onReadCode={handleQRScan}
              showFrame={true}
            />
          </Suspense>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[$.flex_1, $.bg_background]}>
      <View style={[$.flex_1, $.px_3]}>
        {/* Back Button */}
        <TouchableOpacity
          style={[
            $.flex_row,
            $.align_items_center,
            $.mt_2,
            $.mb_2,
            $.py_2,
          ]}
          onPress={() => {
            navigation.navigate('Orders');
          }}
          activeOpacity={0.7}>
          <CustomIcon name={CustomIcons.Back} color={Colors.text} size={24} />
          <Text style={[$.h6, $.font_weight_600, $.text_plain, $.ml_2]}>
            Back to Orders
          </Text>
        </TouchableOpacity>

        <View style={[$.flex_row, $.align_items_start, $.gap_2]}>
          <View style={[$.flex_1]}>
          <FormInput
            label="Search Order"
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Enter Order ID, Group ID, or Barcode"
            keyboardType="default"
            editable={!isLoading}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          </View>
          <TouchableOpacity
            style={[
              {width: 44, height: 44, borderRadius: 8, marginTop: 28},
              $.bg_inputbg,
              $.justify_content_center,
              $.align_items_center,
            ]}
            onPress={handleOpenQRScanner}
            disabled={isLoading}
            activeOpacity={0.7}>
            <CustomIcon name={CustomIcons.QRCode} color={Colors.text} size={24} />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, $.py_6]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[$.mt_3, $.h4, $.text_muted]}>Searching...</Text>
          </View>
        )}

        {searchPerformed && !isLoading && (
          <View style={[$.mt_3, $.flex_1]}>
            {searchMode === 'ordergroupid' && orderGroupSummary ? (
              <ScrollView style={$.flex_1} showsVerticalScrollIndicator={true} contentContainerStyle={[$.p_2]}>
                {/* Order Group Header */}
                <View style={[
                  $.bg_inputbg,
                  $.border_rounded_2,
                  $.p_3,
                  $.border,
                  $.border_default,
                  $.mb_2,
                ]}>
                  <Text style={[$.h4, $.font_weight_bold, $.text_plain, $.mb_2]}>
                  Order #{orderGroupSummary.ordergroup.ordergroupid}
                </Text>
                  <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                    <Text style={[$.h7, $.text_muted, {width: 100}]}>
                      Created:
                    </Text>
                    <Text style={[$.h7, $.text_plain, $.flex_1]}>
                      {formatDate(orderGroupSummary.ordergroup.createdon)}
                    </Text>
                  </View>
                  <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                    <Text style={[$.h7, $.text_muted, {width: 100}]}>
                      Shipping:
                    </Text>
                    <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                      ₹{orderGroupSummary.ordergroup.shippingcharge.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[$.flex_row, $.align_items_center]}>
                    <Text style={[$.h7, $.text_muted, {width: 100}]}>
                      Total:
                    </Text>
                    <Text style={[$.h5, $.font_weight_bold, $.text_primary, $.flex_1]}>
                      ₹{orderGroupSummary.ordergroup.totalprice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Delivery Information */}
                {orderGroupSummary.ordergroup.completedeliveryaddress && (
                  <View style={[
                    $.bg_inputbg,
                    $.border_rounded_2,
                    $.p_3,
                    $.border,
                    $.border_default,
                    $.mb_2,
                  ]}>
                    <Text style={[$.h6, $.font_weight_bold, $.text_plain, $.mb_2]}>
                      Delivery Information
                    </Text>
                    {orderGroupSummary.ordergroup.deliveryinformation && (
                      <>
                        {orderGroupSummary.ordergroup.deliveryinformation.name && (
                          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                            <Text style={[$.h7, $.text_muted, {width: 70}]}>
                              Name:
                            </Text>
                            <Text style={[$.h7, $.text_plain, $.flex_1]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.name}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.deliveryinformation.mobile && (
                          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                            <Text style={[$.h7, $.text_muted, {width: 70}]}>
                              Mobile:
                            </Text>
                            <Text style={[$.h7, $.text_plain, $.flex_1]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.mobile}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.deliveryinformation.email && (
                          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                            <Text style={[$.h7, $.text_muted, {width: 70}]}>
                              Email:
                            </Text>
                            <Text style={[$.h7, $.text_plain, $.flex_1]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.email}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[$.mt_2]}>
                      <Text style={[$.h7, $.text_muted, {lineHeight: 18}]}>
                        {orderGroupSummary.ordergroup.completedeliveryaddress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Pickup Information */}
                {orderGroupSummary.ordergroup.completepickupaddress && (
                  <View style={[
                    $.bg_inputbg,
                    $.border_rounded_2,
                    $.p_3,
                    $.border,
                    $.border_default,
                    $.mb_2,
                  ]}>
                    <Text style={[$.h6, $.font_weight_bold, $.text_plain, $.mb_2]}>
                      Pickup Information
                    </Text>
                    {orderGroupSummary.ordergroup.pickupinformation && (
                      <>
                        {orderGroupSummary.ordergroup.pickupinformation.name && (
                          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                            <Text style={[$.h7, $.text_muted, {width: 70}]}>
                              Name:
                            </Text>
                            <Text style={[$.h7, $.text_plain, $.flex_1]}>
                              {orderGroupSummary.ordergroup.pickupinformation.name}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.pickupinformation.mobile && (
                          <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                            <Text style={[$.h7, $.text_muted, {width: 70}]}>
                              Mobile:
                            </Text>
                            <Text style={[$.h7, $.text_plain, $.flex_1]}>
                              {orderGroupSummary.ordergroup.pickupinformation.mobile}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[$.mt_2]}>
                      <Text style={[$.h7, $.text_muted, {lineHeight: 18}]}>
                        {orderGroupSummary.ordergroup.completepickupaddress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Orders List */}
                {orderGroupSummary.orderlist && orderGroupSummary.orderlist.length > 0 && (
                  <View style={[
                    $.bg_inputbg,
                    $.border_rounded_2,
                    $.p_3,
                    $.border,
                    $.border_default,
                    $.mb_2,
                  ]}>
                    <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_2]}>
                      <Text style={[$.h6, $.font_weight_bold, $.text_plain]}>
                        Orders ({orderGroupSummary.orderlist.length})
                      </Text>
                      {orderGroupSummary.orderlist.some(order => order.orderstatus === Orders.OrderStatuses.Placed) && (
                        <TouchableOpacity
                          style={[
                            $.py_1,
                            $.px_3,
                            $.border_rounded_05,
                            $.bg_secondaryDark,
                            $.align_items_center,
                            $.justify_content_center,
                          ]}
                          onPress={handleConfirmAllPlacedOrders}
                          disabled={isConfirmingAll}>
                          {isConfirmingAll ? (
                            <ActivityIndicator size="small" color={Colors.background} />
                          ) : (
                            <Text style={[$.h7, $.font_weight_600, $.text_white]}>
                              Mark All as Confirm
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    {orderGroupSummary.orderlist.map((order, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          $.bg_background,
                          $.border_rounded_1,
                          $.p_2,
                          $.border,
                          $.border_default,
                          index < (orderGroupSummary.orderlist?.length || 0) - 1 ? $.mb_1 : {},
                        ]}
                        onPress={() => {
                          // Navigate to order details or show status sheet
                          handleViewOrderStatus(order.orderid);
                        }}>
                        <View style={[$.flex_row, $.align_items_center]}>
                          {order.fileid && (
                            <Image
                              source={{uri: getImageUrl(order.fileid)}}
                              style={{width: 50, height: 65, borderRadius: 6, marginRight: 10, backgroundColor: Colors.divider}}
                              resizeMode="cover"
                            />
                          )}
                          <View style={[$.flex_1]}>
                            <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_1]}>
                              <Text style={[$.h6, $.font_weight_600, $.text_plain]}>
                                #{order.orderid}
                              </Text>
                              <Text style={[$.h6, $.font_weight_600, $.text_primary]}>
                                ₹{order.netprice.toFixed(2)}
                              </Text>
                            </View>
                            {order.designcode && (
                              <Text style={[$.h7, $.text_muted, $.mb_1]}>
                                {order.designcode}
                              </Text>
                            )}
                            <View style={[$.flex_row, $.align_items_center, $.justify_content_spaceBetween]}>
                              <Text style={[$.h7, $.text_muted]}>
                                Qty: {order.quantity}
                              </Text>
                              <View style={[
                                $.px_2,
                                $.py_05,
                                $.border_rounded,
                                {backgroundColor: getOrderStatusColor(order.orderstatus).bg},
                              ]}>
                                <Text style={[$.h7, {color: getOrderStatusColor(order.orderstatus).text, fontSize: 11}]}>
                                  {order.orderstatusname}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Payment List */}
                {orderGroupSummary.paymentlist && orderGroupSummary.paymentlist.length > 0 && (
                  <View style={[
                    $.bg_inputbg,
                    $.border_rounded_2,
                    $.p_3,
                    $.border,
                    $.border_default,
                    $.mb_2,
                  ]}>
                    <Text style={[$.h6, $.font_weight_bold, $.text_plain, $.mb_2]}>
                      Payments ({orderGroupSummary.paymentlist.length})
                    </Text>
                    {orderGroupSummary.paymentlist.map((payment, index) => (
                      <View key={index} style={[
                        $.bg_background,
                        $.border_rounded_1,
                        $.p_2,
                        $.border,
                        $.border_default,
                        index < (orderGroupSummary.paymentlist?.length || 0) - 1 ? $.mb_1 : {},
                      ]}>
                        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            {payment.paymentmodename}: 
                          </Text>
                          <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                            ₹{payment.paymentamount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            Status: 
                          </Text>
                          <Text style={[$.h7, $.text_plain, $.flex_1]}>
                            {payment.paymentstatusname}
                          </Text>
                        </View>
                        <View style={[$.flex_row, $.align_items_center]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            Type: 
                          </Text>
                          <Text style={[$.h7, $.text_plain, $.flex_1]}>
                            {payment.paymenttypecodename}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Shipment List */}
                {orderGroupSummary.shipmentlist && orderGroupSummary.shipmentlist.length > 0 && (
                  <View style={[
                    $.bg_inputbg,
                    $.border_rounded_2,
                    $.p_3,
                    $.border,
                    $.border_default,
                    $.mb_2,
                  ]}>
                    <Text style={[$.h6, $.font_weight_bold, $.text_plain, $.mb_2]}>
                      Shipments ({orderGroupSummary.shipmentlist.length})
                    </Text>
                    {orderGroupSummary.shipmentlist.map((shipment, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          $.bg_background,
                          $.border_rounded_1,
                          $.p_2,
                          $.border,
                          $.border_default,
                          index < (orderGroupSummary.shipmentlist?.length || 0) - 1 ? $.mb_1 : {},
                        ]}
                        onPress={() => {
                          appNavigation.navigate('CreateShipment', {
                            ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
                            ordershipmentgroupid: shipment.shipmentgroupid,
                            orderid: 0,
                          });
                        }}>
                        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            Shipment ID:
                          </Text>
                          <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                            #{shipment.shipmentgroupid}
                          </Text>
                        </View>
                        <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            Status:
                          </Text>
                          <Text style={[$.h7, $.text_plain, $.flex_1]}>
                            {shipment.statusname}
                          </Text>
                        </View>
                        <View style={[$.flex_row, $.align_items_center]}>
                          <Text style={[$.h7, $.text_muted, {width: 90}]}>
                            Items Count:
                          </Text>
                          <Text style={[$.h7, $.text_plain, $.flex_1]}>
                            {shipment.ordercount}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Create Shipment Button */}
                {orderGroupSummary.cancreateshipment && (
                  <TouchableOpacity
                    style={[
                      $.py_3,
                      $.px_5,
                      $.border_rounded_2,
                      $.bg_primary,
                      {minHeight: 48},
                      $.align_items_center,
                      $.justify_content_center,
                      $.mb_2,
                      $.shadow_medium,
                    ]}
                    onPress={() => {
                      // Navigate to create shipment screen
                      appNavigation.navigate('CreateShipment', {
                        ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
                        ordershipmentgroupid: 0,
                        orderid: 0,
                      });
                    }}>
                    <View style={[$.flex_row, $.align_items_center, $.justify_content_center]}>
                      <CustomIcon name={CustomIcons.Qrcode} size={18} color={Colors.background} />
                      <Text style={[$.h6, $.font_weight_600, $.text_white, $.ml_1]}>
                        Create Shipment
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : orderSummary ? (
              <ScrollView style={$.flex_1}>
                <Text style={[$.h3, $.font_weight_bold, $.text_plain, $.mb_3]}>
                  Order #{orderSummary.orderid}
                </Text>
                {/* Add order summary details rendering here */}
              </ScrollView>
            ) : orders.length > 0 ? (
              <>
                <Text style={[$.h3, $.font_weight_bold, $.mb_3, $.text_plain]}>
                  Search Results ({orders.length})
                </Text>
                <FlatList
                  data={orders}
                  renderItem={renderOrderItem}
                  keyExtractor={item => item.id.toString()}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={$.pb_5}
                />
              </>
            ) : (
              <View style={[$.p_6, $.align_items_center, $.justify_content_center]}>
                <Text style={[$.h4, $.text_muted]}>
                  No orders found for this search
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Order Status Bottom Sheet */}
      <BottomSheet
        visible={showStatusSheet}
        onClose={() => {
          setShowStatusSheet(false);
          setOrderStatusData(null);
        }}
        height="70%">
        {loadingStatus ? (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, $.py_6]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[$.mt_3, $.h5, $.text_muted]}>Loading status...</Text>
          </View>
        ) : orderStatusData ? (
          <>
            {/* Status Badge - Small, Right Corner */}
            <View style={[$.mb_2, $.align_items_end]}>
              <View style={[
                $.px_2,
                $.py_05,
                $.border_rounded_1,
                {alignSelf: 'flex-end', backgroundColor: getOrderStatusColor(orderStatusData.orderstatus).bg},
              ]}>
                <Text style={[$.h7, $.font_weight_600, {color: getOrderStatusColor(orderStatusData.orderstatus).text}]}>
                  {getOrderStatusName(orderStatusData.orderstatus)}
            </Text>
              </View>
            </View>

            {/* Image and Details Card - Combined Card */}
            <View style={[
              $.bg_inputbg,
              $.border_rounded_2,
              $.p_2,
              $.border,
              $.border_default,
              $.mb_2,
            ]}>
              <View style={[$.flex_row, $.align_items_stretch]}>
                {/* Image on Left */}
                {orderStatusData.fileid > 0 && (
                  <View style={[
                    {
                      width: 100,
                      height: 130,
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: Colors.divider,
                    },
                  ]}>
                    <Image
                      source={{uri: getImageUrl(orderStatusData.fileid)}}
                      style={[{width: '100%', height: '100%'}]}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Details on Right */}
                <View style={[$.flex_1, $.pl_2]}>
                  {/* Total Price */}
                  <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_1, $.pb_1, $.border_bottom, $.border_default]}>
                    <Text style={[$.h7, $.text_muted]}>Total</Text>
                    <Text style={[$.h6, $.font_weight_bold, $.text_primary]}>
                      {formatPrice(orderStatusData.ordernetprice)}
                    </Text>
                  </View>

                  {/* Order Details */}
                  <View style={$.mb_1}>
                    <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                      <Text style={[$.h7, $.text_muted, $.flex_1]}>Qty</Text>
                      <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                        {orderStatusData.orderquantity}
                      </Text>
                    </View>

                    {orderStatusData.designcode && (
                      <View style={[$.flex_row, $.align_items_center, $.mb_1]}>
                        <Text style={[$.h7, $.text_muted, $.flex_1]}>Design</Text>
                        <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]} numberOfLines={1}>
                          {orderStatusData.designcode}
                        </Text>
                      </View>
                    )}

                    {orderStatusData.orderunitnetprice !== undefined && (
                      <View style={[$.flex_row, $.align_items_center]}>
                        <Text style={[$.h7, $.text_muted, $.flex_1]}>Unit</Text>
                        <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                          {formatPrice(orderStatusData.orderunitnetprice)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* SKU Attributes */}
                  {orderStatusData.skuattributelist && orderStatusData.skuattributelist.length > 0 && (
                    <View style={[$.pt_1, $.border_top, $.border_default]}>
                      {orderStatusData.skuattributelist.map((attr, index) => {
                        const isLast = index === orderStatusData.skuattributelist!.length - 1;
                        return (
                          <View key={index} style={[$.flex_row, $.align_items_center, !isLast ? $.mb_1 : {}]}>
                            <Text style={[$.h7, $.text_muted, $.flex_1]} numberOfLines={1}>
                              {attr.attributename || attr.skudesignattributename || 'Attr'}
                            </Text>
                            <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]} numberOfLines={1}>
                              {attr.attributevaluename || attr.skudesignattributevaluename || 'N/A'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Status Timeline */}
            {orderStatusData.orderhistory?.statushistory && orderStatusData.orderhistory.statushistory.length > 0 && (
              <View style={[
                $.bg_inputbg,
                $.border_rounded_2,
                $.p_3,
                $.border,
                $.border_default,
                $.mb_2,
              ]}>
                <Text style={[$.h6, $.font_weight_bold, $.text_plain, $.mb_2]}>
                  Status Timeline
                </Text>
                {orderStatusData.orderhistory.statushistory.map((history, index) => {
                  const isLast = index === orderStatusData.orderhistory!.statushistory!.length - 1;
                  return (
                    <View key={index} style={[
                      $.pb_2,
                      $.border_left_2,
                      $.border_default,
                      $.pl_2,
                      !isLast ? $.mb_2 : {},
                    ]}>
                      <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center]}>
                        <Text style={[$.h7, $.font_weight_600, $.text_plain, $.flex_1]}>
                          {history.statusname || getOrderStatusName(history.status)}
                        </Text>
                        <Text style={[$.h7, $.text_muted, $.small]}>
                          {formatDateTime(history.modifiedon)}
                        </Text>
                      </View>
                      {history.notes && history.notes.trim() && (
                        <Text style={[$.h7, $.text_muted, $.small, $.mt_05]} numberOfLines={2}>
                          {history.notes}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Notes Input - Show above action buttons if any action buttons are available */}
            {(orderStatusData.orderstatus === Orders.OrderStatuses.Placed ||
              orderStatusData.orderstatus === Orders.OrderStatuses.Confirmed ||
              orderStatusData.cancancel ||
              orderStatusData.canrefund) && (
              <View style={[$.mb_2]}>
                <FormInput
                  label="Notes"
                  value={statusNotes}
                  onChangeText={setStatusNotes}
                  placeholder="Enter notes..."
                  multiline={true}
                  numberOfLines={2}
                />
              </View>
            )}

            {/* Action Buttons - Confirm + Cancel */}
            <View style={[$.mb_2]}>
              {/* Confirm Order Button (for Placed status) */}
              {orderStatusData.orderstatus === Orders.OrderStatuses.Placed && (
                <TouchableOpacity
                  style={[
                    $.py_3,
                    $.px_5,
                    $.border_rounded_2,
                    {minHeight: 44},
                    $.bg_secondaryDark,
                    $.align_items_center,
                    $.justify_content_center,
                    $.mb_2,
                    $.shadow_medium,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h6, $.font_weight_600, $.text_white]}>
                      Confirm Order
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Cancel Order Button */}
              {Orders.OrderStatuses.Cancelled !== orderStatusData.orderstatus && (
                <TouchableOpacity
                  style={[
                    $.py_3,
                    $.px_5,
                    $.border_rounded_2,
                    {minHeight: 44},
                    $.bg_danger,
                    $.align_items_center,
                    $.justify_content_center,
                    $.shadow_medium,
                  ]}
                  onPress={handleCancelOrder}
                  disabled={isCanceling}>
                  {isCanceling ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h6, $.font_weight_600, $.text_white]}>
                      Cancel Order
                    </Text>
            )}
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, $.py_6]}>
            <Text style={[$.h5, $.text_muted]}>No status data available</Text>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}


