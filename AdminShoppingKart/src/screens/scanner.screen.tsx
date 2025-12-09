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
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
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

  const ordersService = useRef(new OrdersService()).current;
  const orderGroupService = useRef(new OrderGroupService()).current;
  const skuBarcodeMapService = useRef(new SkuBarcodeMapService()).current;
  const usersService = useRef(new UsersService()).current;
  
  // Track if we've already loaded the groupid to prevent infinite loops
  const hasLoadedGroupId = useRef<number | null>(null);

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
        const orderReq = {
          getall: false,
          skuid: skuId,
        };
        console.log('🔍 Fetching orders for SKU ID:', skuId);
        const ordersForSku = await ordersService.getWithDetails(orderReq);
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

  // Auto-search when groupid is passed via route params
  useEffect(() => {
    const groupid = route.params?.groupid;
    // Only load if groupid exists, is valid, and hasn't been loaded yet
    if (groupid && groupid > 0 && hasLoadedGroupId.current !== groupid) {
      hasLoadedGroupId.current = groupid;
      setSearchText(groupid.toString());
      (async () => {
        try {
          setIsLoading(true);
          setSearchPerformed(true);
          setOrders([]);
          setOrderSummary(null);
          setOrderGroupSummary(null);
          
          const groupSummary = await orderGroupService.adminPanelOrderSummaryV3({ordergroupid: groupid});
          
          if (!groupSummary || !groupSummary.ordergroup || groupSummary.ordergroup.ordergroupid <= 0) {
            Alert.alert('Error', 'Order group not found');
            hasLoadedGroupId.current = null; // Reset on error so it can retry if needed
            return;
          }
          
          setOrderGroupSummary(groupSummary);
          setOrderSummary(null);
          setOrders([]);
          setSearchMode('ordergroupid');
        } catch (error: any) {
          console.error('Error fetching order group:', error);
          
          // Don't show alert for 401 - it's handled by interceptor, and don't retry
          const statusCode = error?.response?.status;
          if (statusCode === 401) {
            console.log('401 Unauthorized - stopping retries');
            // Keep the hasLoadedGroupId to prevent retries on 401
            // Don't reset it so it won't try again
            setIsLoading(false);
            return;
          }
          
          // Reset on other errors so it can retry if needed
          hasLoadedGroupId.current = null;
          Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to load order group details');
        } finally {
          setIsLoading(false);
        }
      })();
    }
    
    // Reset when groupid is cleared
    if (!groupid || groupid <= 0) {
      hasLoadedGroupId.current = null;
    }
  }, [route.params?.groupid]);

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
    return `${environment.baseurl}/api/Files/get?id=${fileid}`;
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
      } else if (orderStatusData.orderstatus === Orders.OrderStatuses.Confirmed) {
        await usersService.OrderPicked({
          orderid: orderStatusData.orderid,
          notes: statusNotes || '',
        });
      } else if (orderStatusData.orderstatus === Orders.OrderStatuses.Picked) {
        await usersService.OrderChecked({
          orderid: orderStatusData.orderid,
          notes: statusNotes || '',
        });
      } else if (orderStatusData.orderstatus === Orders.OrderStatuses.Checked) {
        await usersService.OrderPacked({
          orderid: orderStatusData.orderid,
          notes: statusNotes || '',
        });
      } else {
        await ordersService.moveToNextStatus({
          orderid: orderStatusData.orderid,
          note: statusNotes,
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
          {backgroundColor: Colors.background},
          $.p_3,
          $.mb_3,
          $.border_rounded_1,
          $.border,
          {borderColor: Colors.divider},
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
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}]}>#{item.id}</Text>
          <View style={[$.px_2, $.py_1, $.border_rounded, {backgroundColor: statusColor.bg}]}>
            <Text style={[$.h7, $.font_weight_600, {color: statusColor.text}]}>
              {statusName}
            </Text>
          </View>
        </View>
        <Text style={[$.h5, $.font_weight_600, {color: Colors.text}, $.mb_1]}>{item.designcode || 'N/A'}</Text>
        <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center]}>
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.primary}]}>₹{item.netprice.toFixed(2)}</Text>
          <Text style={[$.h6, {color: Colors.textSecondary}]}>Qty: {item.quantity}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Show QR Scanner
  if (showQRScanner && hasCameraPermission) {
    return (
      <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowQRScanner(false);
                setHasCameraPermission(false);
              }}>
              <CustomIcon name={CustomIcons.Close} color={Colors.background} size={24} />
            </TouchableOpacity>
            <Text style={[$.h4, $.font_weight_bold, {color: Colors.background}]}>
              Scan QR Code
            </Text>
            <View style={{width: 24}} />
          </View>
          <Suspense fallback={
            <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[$.mt_3, {color: Colors.textSecondary}]}>Loading camera...</Text>
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
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <View style={[$.flex_1, $.px_3]}>
        <View style={styles.searchContainer}>
          <View style={[$.flex_1, $.mr_2]}>
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
            style={styles.qrButton}
            onPress={handleOpenQRScanner}
            disabled={isLoading}
            activeOpacity={0.7}>
            <CustomIcon name={CustomIcons.QRCode} color={Colors.background} size={24} />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, $.py_6]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[$.mt_3, $.h4, {color: Colors.textSecondary}]}>Searching...</Text>
          </View>
        )}

        {searchPerformed && !isLoading && (
          <View style={[$.mt_5, $.flex_1]}>
            {searchMode === 'ordergroupid' && orderGroupSummary ? (
              <ScrollView style={$.flex_1} showsVerticalScrollIndicator={true}>
                {/* Order Group Header */}
                <View style={[styles.orderGroupCard, $.mb_3]}>
                  <Text style={[$.h3, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
                    Order Group #{orderGroupSummary.ordergroup.ordergroupid}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                      Created On:
                    </Text>
                    <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                      {formatDate(orderGroupSummary.ordergroup.createdon)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                      Shipping Charge:
                    </Text>
                    <Text style={[$.h6, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                      ₹{orderGroupSummary.ordergroup.shippingcharge.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                      Total Price:
                    </Text>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.primary, flex: 1}]}>
                      ₹{orderGroupSummary.ordergroup.totalprice.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Delivery Information */}
                {orderGroupSummary.ordergroup.completedeliveryaddress && (
                  <View style={[styles.orderGroupCard, $.mb_3]}>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
                      Delivery Information
                    </Text>
                    {orderGroupSummary.ordergroup.deliveryinformation && (
                      <>
                        {orderGroupSummary.ordergroup.deliveryinformation.name && (
                          <View style={styles.infoRow}>
                            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                              Name:
                            </Text>
                            <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.name}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.deliveryinformation.mobile && (
                          <View style={styles.infoRow}>
                            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                              Mobile:
                            </Text>
                            <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.mobile}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.deliveryinformation.email && (
                          <View style={styles.infoRow}>
                            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                              Email:
                            </Text>
                            <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                              {orderGroupSummary.ordergroup.deliveryinformation.email}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[styles.infoRow, $.mt_2]}>
                      <Text style={[$.h6, {color: Colors.textSecondary}]}>
                        {orderGroupSummary.ordergroup.completedeliveryaddress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Pickup Information */}
                {orderGroupSummary.ordergroup.completepickupaddress && (
                  <View style={[styles.orderGroupCard, $.mb_3]}>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
                      Pickup Information
                    </Text>
                    {orderGroupSummary.ordergroup.pickupinformation && (
                      <>
                        {orderGroupSummary.ordergroup.pickupinformation.name && (
                          <View style={styles.infoRow}>
                            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                              Name:
                            </Text>
                            <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                              {orderGroupSummary.ordergroup.pickupinformation.name}
                            </Text>
                          </View>
                        )}
                        {orderGroupSummary.ordergroup.pickupinformation.mobile && (
                          <View style={styles.infoRow}>
                            <Text style={[$.h6, {color: Colors.textSecondary, width: 100}]}>
                              Mobile:
                            </Text>
                            <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                              {orderGroupSummary.ordergroup.pickupinformation.mobile}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={[styles.infoRow, $.mt_2]}>
                      <Text style={[$.h6, {color: Colors.textSecondary}]}>
                        {orderGroupSummary.ordergroup.completepickupaddress}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Orders List */}
                {orderGroupSummary.orderlist && orderGroupSummary.orderlist.length > 0 && (
                  <View style={[styles.orderGroupCard, $.mb_3]}>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
                      Orders ({orderGroupSummary.orderlist.length})
                    </Text>
                    {orderGroupSummary.orderlist.map((order, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.orderItemCard, $.mb_2]}
                        onPress={() => {
                          // Navigate to order details or show status sheet
                          handleViewOrderStatus(order.orderid);
                        }}>
                        <View style={styles.orderItemRow}>
                          {order.fileid && (
                            <Image
                              source={{uri: `${environment.baseurl}/api/Files/get?id=${order.fileid}`}}
                              style={styles.orderImage}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.orderItemContent}>
                            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                              Order #{order.orderid}
                            </Text>
                            {order.designcode && (
                              <Text style={[$.h6, {color: Colors.textSecondary}]}>
                                {order.designcode}
                              </Text>
                            )}
                            <View style={styles.orderItemDetails}>
                              <Text style={[$.h6, {color: Colors.textSecondary}]}>
                                Qty: {order.quantity}
                              </Text>
                              <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                                ₹{order.netprice.toFixed(2)}
                              </Text>
                            </View>
                            <View style={[styles.statusBadge, {backgroundColor: getOrderStatusColor(order.orderstatus).bg}]}>
                              <Text style={[$.h6, {color: getOrderStatusColor(order.orderstatus).text, fontSize: 12}]}>
                                {order.orderstatusname}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Payment List */}
                {orderGroupSummary.paymentlist && orderGroupSummary.paymentlist.length > 0 && (
                  <View style={[styles.orderGroupCard, $.mb_3]}>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
                      Payments ({orderGroupSummary.paymentlist.length})
                    </Text>
                    {orderGroupSummary.paymentlist.map((payment, index) => (
                      <View key={index} style={[styles.paymentItem, $.mb_2]}>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            {payment.paymentmodename}:
                          </Text>
                          <Text style={[$.h6, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                            ₹{payment.paymentamount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            Status:
                          </Text>
                          <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                            {payment.paymentstatusname}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            Type:
                          </Text>
                          <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                            {payment.paymenttypecodename}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Shipment List */}
                {orderGroupSummary.shipmentlist && orderGroupSummary.shipmentlist.length > 0 && (
                  <View style={[styles.orderGroupCard, $.mb_3]}>
                    <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
                      Shipments ({orderGroupSummary.shipmentlist.length})
                    </Text>
                    {orderGroupSummary.shipmentlist.map((shipment, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.shipmentItem, $.mb_2]}
                        onPress={() => {
                          appNavigation.navigate('CreateShipment', {
                            ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
                            ordershipmentgroupid: shipment.shipmentgroupid,
                            orderid: 0,
                          });
                        }}>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            Shipment ID:
                          </Text>
                          <Text style={[$.h6, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                            #{shipment.shipmentgroupid}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            Status:
                          </Text>
                          <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                            {shipment.statusname}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Text style={[$.h6, {color: Colors.textSecondary, width: 120}]}>
                            Orders:
                          </Text>
                          <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
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
                    style={[styles.createShipmentButton, $.mb_3]}
                    onPress={() => {
                      // Navigate to create shipment screen
                      appNavigation.navigate('CreateShipment', {
                        ordergroupid: orderGroupSummary.ordergroup.ordergroupid,
                        ordershipmentgroupid: 0,
                        orderid: 0,
                      });
                    }}>
                    <View style={styles.createShipmentButtonContent}>
                      <CustomIcon name={CustomIcons.truck} size={20} color={Colors.background} />
                      <Text style={[$.h5, $.font_weight_600, {color: Colors.background, marginLeft: 8}]}>
                        Create Shipment
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : orderSummary ? (
              <ScrollView style={$.flex_1}>
                <Text style={[$.h3, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
                  Order #{orderSummary.orderid}
                </Text>
                {/* Add order summary details rendering here */}
              </ScrollView>
            ) : orders.length > 0 ? (
              <>
                <Text style={[$.h3, $.font_weight_bold, $.mb_3, {color: Colors.text}]}>
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
                <Text style={[$.h4, {color: Colors.textSecondary}]}>
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
            <Text style={[$.mt_3, $.h5, {color: Colors.textSecondary}]}>Loading status...</Text>
          </View>
        ) : orderStatusData ? (
          <>
            {/* Status Badge - Small, Right Corner */}
            <View style={[$.mb_3, $.align_items_flexEnd]}>
              <View style={[styles.statusBadgeSmall, {backgroundColor: getOrderStatusColor(orderStatusData.orderstatus).bg}]}>
                <Text style={[$.h7, $.font_weight_600, {color: getOrderStatusColor(orderStatusData.orderstatus).text}]}>
                  {getOrderStatusName(orderStatusData.orderstatus)}
                </Text>
              </View>
            </View>

            {/* Image and Details Card - Combined Card */}
            <View style={[styles.combinedCard, $.mb_3]}>
              <View style={[$.flex_row, $.align_items_stretch]}>
                {/* Image on Left */}
                {orderStatusData.fileid > 0 && (
                  <View style={styles.orderImageContainer}>
                    <Image
                      source={{uri: getImageUrl(orderStatusData.fileid)}}
                      style={styles.orderStatusImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Details on Right */}
                <View style={[$.flex_1, $.pl_2]}>
                  {/* Total Price */}
                  <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_2, $.pb_2, {borderBottomWidth: 1, borderBottomColor: Colors.divider}]}>
                    <Text style={[$.h7, {color: Colors.textSecondary}]}>Total</Text>
                    <Text style={[$.h6, $.font_weight_bold, {color: Colors.primary}]}>
                      {formatPrice(orderStatusData.ordernetprice)}
                    </Text>
                  </View>

                  {/* Order Details */}
                  <View style={$.mb_1}>
                    <View style={[styles.infoRow, $.mb_1]}>
                      <Text style={[$.h7, {color: Colors.textSecondary, flex: 1}]}>Quantity</Text>
                      <Text style={[$.h7, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                        {orderStatusData.orderquantity}
                      </Text>
                    </View>

                    {orderStatusData.designcode && (
                      <View style={[styles.infoRow, $.mb_1]}>
                        <Text style={[$.h7, {color: Colors.textSecondary, flex: 1}]}>Design</Text>
                        <Text style={[$.h7, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                          {orderStatusData.designcode}
                        </Text>
                      </View>
                    )}

                    {orderStatusData.orderunitnetprice !== undefined && (
                      <View style={styles.infoRow}>
                        <Text style={[$.h7, {color: Colors.textSecondary, flex: 1}]}>Unit Price</Text>
                        <Text style={[$.h7, $.font_weight_600, {color: Colors.text, flex: 1}]}>
                          {formatPrice(orderStatusData.orderunitnetprice)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* SKU Attributes */}
                  {orderStatusData.skuattributelist && orderStatusData.skuattributelist.length > 0 && (
                    <View style={[$.pt_1, {borderTopWidth: 1, borderTopColor: Colors.divider}]}>
                      {orderStatusData.skuattributelist.map((attr, index) => {
                        const isLast = index === orderStatusData.skuattributelist!.length - 1;
                        return (
                          <View key={index} style={[styles.infoRow, !isLast ? $.mb_1 : {}]}>
                            <Text style={[$.h7, {color: Colors.textSecondary, flex: 1}]}>
                              {attr.attributename || attr.skudesignattributename || 'Attribute'}
                            </Text>
                            <Text style={[$.h7, $.font_weight_600, {color: Colors.text, flex: 1}]}>
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
              <View style={[styles.statusCard, $.mb_3]}>
                <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
                  Status Timeline
                </Text>
                {orderStatusData.orderhistory.statushistory.map((history, index) => {
                  const isLast = index === orderStatusData.orderhistory!.statushistory!.length - 1;
                  return (
                    <View key={index} style={[styles.timelineItem, !isLast ? $.mb_3 : {}]}>
                      <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.mb_1]}>
                        <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                          {history.statusname || getOrderStatusName(history.status)}
                        </Text>
                        <Text style={[$.h7, {color: Colors.textSecondary}]}>
                          {formatDateTime(history.modifiedon)}
                        </Text>
                      </View>
                      {history.notes && history.notes.trim() && (
                        <Text style={[$.h7, {color: Colors.textSecondary}, $.mt_1]}>
                          {history.notes}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Action Buttons */}
            <View style={[$.mb_3]}>
              {/* Confirm Order Button (for Placed status) */}
              {orderStatusData.orderstatus === Orders.OrderStatuses.Placed && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.secondaryDark},
                    $.mb_2,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Confirm Order
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Picked Button (for Confirmed status) */}
              {orderStatusData.orderstatus === Orders.OrderStatuses.Confirmed && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.primaryDark},
                    $.mb_2,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Picked
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Checked Button (for Picked status) */}
              {orderStatusData.orderstatus === Orders.OrderStatuses.Picked && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.primaryDark},
                    $.mb_2,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Checked
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Packed Button (for Checked status) */}
              {orderStatusData.orderstatus === Orders.OrderStatuses.Checked && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.primaryDark},
                    $.mb_2,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Packed
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Move to Next Status Button (for other statuses) */}
              {orderStatusData.orderstatus !== Orders.OrderStatuses.Placed && 
               orderStatusData.orderstatus !== Orders.OrderStatuses.Confirmed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Picked &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Checked &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Packed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Delivered &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Cancelled &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Closed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Refunded &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.RefundFailed && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.primaryDark},
                    $.mb_2,
                  ]}
                  onPress={handleMoveToNextStatus}
                  disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Move to Next Status
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Cancel Order Button */}
              {orderStatusData.cancancel && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.error},
                    $.mb_2,
                  ]}
                  onPress={handleCancelOrder}
                  disabled={isCanceling}>
                  {isCanceling ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                      Cancel Order
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Refund Button */}
              {orderStatusData.canrefund && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {backgroundColor: ColorPalette.warning},
                  ]}
                  onPress={() => {
                    Alert.alert('Info', 'Refund functionality coming soon');
                  }}>
                  <Text style={[$.h5, $.font_weight_600, {color: Colors.text}]}>
                    Initiate Refund
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notes Input - Only show if there are action buttons */}
            {(orderStatusData.orderstatus === Orders.OrderStatuses.Placed ||
              orderStatusData.orderstatus === Orders.OrderStatuses.Confirmed ||
              orderStatusData.orderstatus === Orders.OrderStatuses.Picked ||
              orderStatusData.orderstatus === Orders.OrderStatuses.Checked ||
              (orderStatusData.orderstatus !== Orders.OrderStatuses.Placed && 
               orderStatusData.orderstatus !== Orders.OrderStatuses.Confirmed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Picked &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Checked &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Packed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Delivered &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Cancelled &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Closed &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.Refunded &&
               orderStatusData.orderstatus !== Orders.OrderStatuses.RefundFailed) ||
              orderStatusData.cancancel ||
              orderStatusData.canrefund) && (
              <View style={[$.mb_3]}>
                <FormInput
                  label="Notes"
                  value={statusNotes}
                  onChangeText={setStatusNotes}
                  placeholder="Enter notes..."
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            )}
          </>
        ) : (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, $.py_6]}>
            <Text style={[$.h5, {color: Colors.textSecondary}]}>No status data available</Text>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 12,
  },
  qrButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginLeft: 8,
    ...$.shadow_medium,
  },
  orderGroupCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderItemCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.divider,
  },
  orderItemContent: {
    flex: 1,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  paymentItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statusHeaderCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statusCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.divider,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  orderImageContainer: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.divider,
  },
  orderStatusImage: {
    width: '100%',
    height: '100%',
  },
  combinedCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  customisationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  historyItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  timelineItem: {
    paddingBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.divider,
    paddingLeft: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...$.shadow_medium,
  },
  createShipmentButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: ColorPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...$.shadow_medium,
    elevation: 4,
    shadowColor: ColorPalette.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createShipmentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipmentItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
