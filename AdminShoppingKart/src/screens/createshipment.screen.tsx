import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../appstack.navigation';
import {Colors, $, ColorPalette} from '../styles';
import {FormInput} from '../components/forminput.component';
import {BottomSheet} from '../components/bottomsheet.component';
import {OrderShipmentGroupService} from '../services/ordershipmentgroup.service';
import {
  OrderShipmentGroupAdminPanelOrderDetailShipmentRes,
  OrderShipmentGroupAdminPanelOrderDetailShipmentResOrder,
  OrderShipmentGroupInitiateShipmentForShiprocketReq,
  OrderShipmentGroup,
  OrderShipmentGroupCreateShiprocketOrderReq,
  OrderShipmentGroupCreateCustomOrderReq,
} from '../models/ordershipmentgroup.model';
import {formatPrice} from '../utils/format.utils';
import {formatDateTime} from '../utils/date.utils';
import {environment} from '../utils/environment';
import {useAppSelector} from '../redux/hooks.redux';
import {selectenvironment} from '../redux/environment.redux';

type CreateShipmentScreenRouteProp = RouteProp<AppStackParamList, 'CreateShipment'>;
type CreateShipmentScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export function CreateShipmentScreen() {
  const route = useRoute<CreateShipmentScreenRouteProp>();
  const navigation = useNavigation<CreateShipmentScreenNavigationProp>();
  const environmentState = useAppSelector(selectenvironment);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isPacking, setIsPacking] = useState(false);

  const ordergroupid = route.params?.ordergroupid || 0;
  const ordershipmentgroupid = route.params?.ordershipmentgroupid || 0;
  const orderid = (route.params && 'orderid' in route.params) ? route.params.orderid || 0 : 0;

  const orderShipmentGroupService = new OrderShipmentGroupService();

  const [shipmentData, setShipmentData] = useState<OrderShipmentGroupAdminPanelOrderDetailShipmentRes | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<number>(OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket);
  const [showPartnerSheet, setShowPartnerSheet] = useState<boolean>(false);
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [pickupLocationPincode, setPickupLocationPincode] = useState<string>('');
  const [packageLength, setPackageLength] = useState<string>('');
  const [packageBreadth, setPackageBreadth] = useState<string>('');
  const [packageHeight, setPackageHeight] = useState<string>('');
  const [packageWeight, setPackageWeight] = useState<string>('');
  const [customPartnerName, setCustomPartnerName] = useState<string>('');
  const [selectedCourierId, setSelectedCourierId] = useState<number>(0);
  const [isRequestingPickup, setIsRequestingPickup] = useState(false);
  const [isCancelingPickup, setIsCancelingPickup] = useState(false);
  const [isCancelingShipment, setIsCancelingShipment] = useState(false);

  useEffect(() => {
    if (ordergroupid > 0) {
      loadShipmentData();
    }
  }, [ordergroupid, ordershipmentgroupid]);

  const loadShipmentData = async () => {
    try {
      setIsLoading(true);
      const data = await orderShipmentGroupService.adminPanelOrderDetailShipment({
        ordergroupid,
        ordershipmentgroupid,
      });
      setShipmentData(data);

      // Set default partner
      if (data.ordershipmentgroup.ordershipmentgroupid > 0) {
        setSelectedPartner(data.ordershipmentgroup.ordershipmentgrouppartner);
        if (data.ordershipmentgroup.custompartnername) {
          setCustomPartnerName(data.ordershipmentgroup.custompartnername);
        }
        // Only set pickup location if shipment already exists
        if (data.ordershipmentgroup.shiprocketpickuplocationname) {
          setPickupLocation(data.ordershipmentgroup.shiprocketpickuplocationname);
          setPickupLocationPincode(data.ordershipmentgroup.shiprocketpickuplocationpincode);
        }
      } else if (data.partnerlist.length > 0) {
        // Default to first partner (usually Shiprocket)
        setSelectedPartner(data.partnerlist[0].value);
      }

      if (data.ordershipmentgroup.shiprocketpackagedetails) {
        setPackageLength(data.ordershipmentgroup.shiprocketpackagedetails.length.toString());
        setPackageBreadth(data.ordershipmentgroup.shiprocketpackagedetails.breadth.toString());
        setPackageHeight(data.ordershipmentgroup.shiprocketpackagedetails.height.toString());
        setPackageWeight(data.ordershipmentgroup.shiprocketpackagedetails.weight.toString());
      }

      // If orderid is provided, select that order by default
      if (orderid > 0) {
        setSelectedOrders([orderid]);
      } else if (data.orderlist.length > 0) {
        // Select all existing orders in shipment
        setSelectedOrders(data.orderlist.map(o => o.orderid));
      } else if (data.eligibleorderlist.length > 0) {
        // Select all eligible orders by default
        setSelectedOrders(data.eligibleorderlist.map(o => o.orderid));
      }
    } catch (error: any) {
      console.error('Error loading shipment data:', error);
      Alert.alert('Error', error?.message || 'Failed to load shipment data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleCreateShipment = async () => {
    if (selectedOrders.length === 0) {
      Alert.alert('Error', 'Please select at least one order');
      return;
    }

    if (selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket) {
      if (!pickupLocation || !pickupLocationPincode) {
        Alert.alert('Error', 'Please select a pickup location');
        return;
      }

      if (!packageLength || !packageBreadth || !packageHeight || !packageWeight) {
        Alert.alert('Error', 'Please fill all package details');
        return;
      }
    } else if (selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Custom) {
      if (!customPartnerName.trim()) {
        Alert.alert('Error', 'Please enter custom partner name');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      if (selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket) {
        const req: OrderShipmentGroupCreateShiprocketOrderReq = {
          orderidlist: selectedOrders,
          shiprocketpickuplocationname: pickupLocation,
          shiprocketpickuplocationpincode: pickupLocationPincode,
          shiprocketpackagedetails: {
            length: parseFloat(packageLength) || 0,
            breadth: parseFloat(packageBreadth) || 0,
            height: parseFloat(packageHeight) || 0,
            weight: parseFloat(packageWeight) || 0,
          },
        };

        const response = await orderShipmentGroupService.createShiprocketOrder(req);
        Alert.alert('Success', 'Shiprocket shipment created successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      } else if (selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Custom) {
        const req: OrderShipmentGroupCreateCustomOrderReq = {
          orderidlist: selectedOrders,
          custompartnername: customPartnerName,
        };

        const response = await orderShipmentGroupService.createCustomOrder(req);
        Alert.alert('Success', 'Custom shipment created successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      Alert.alert('Error', error?.message || 'Failed to create shipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (fileid?: number): string => {
    if (!fileid) return '';
    const baseurl = environmentState.url || environment.baseurl;
    return `${baseurl}/api/Files/get?id=${fileid}`;
  };

  const handleRequestPickup = async () => {
    // Local guard: if pickup already scheduled (server has flagged it), don't call API again
    if (
      shipmentData?.ordershipmentgroup &&
      shipmentData.ordershipmentgroup.shiprocketpickupscheduleddate
    ) {
      Alert.alert('Info', 'Pickup has already been requested for this shipment.');
      return;
    }

    if (!selectedCourierId || selectedCourierId <= 0) {
      Alert.alert('Error', 'Please select a courier');
      return;
    }

    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }

    try {
      setIsRequestingPickup(true);
      await orderShipmentGroupService.requestForShipmentPickup({
        shipmentgroupid: ordershipmentgroupid,
        courierid: selectedCourierId,
      });
      
      Alert.alert('Success', 'Pickup requested successfully', [
        {
          text: 'OK',
          onPress: () => {
            loadShipmentData(); // Reload data to update status
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error requesting pickup:', error);
      const apiError = error?.response?.data;
      const key = apiError?.key || apiError?.Key;
      const message = apiError?.message || apiError?.Message || error?.message;

      if (key === 'ShipmentPickupAlreadyRequested') {
        Alert.alert('Info', 'Pickup has already been requested for this shipment.');
      } else {
        Alert.alert('Error', message || 'Failed to request pickup');
      }
    } finally {
      setIsRequestingPickup(false);
    }
  };

  const handleCancelPickup = async () => {
    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }

    Alert.alert(
      'Confirm Cancel',
      'Are you sure you want to cancel the pickup?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelingPickup(true);
              await orderShipmentGroupService.cancelShiprocketShipment({
                shipmentgroupid: ordershipmentgroupid,
              });
              
              Alert.alert('Success', 'Pickup cancelled successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    loadShipmentData(); // Reload data to update status
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Error canceling pickup:', error);
              Alert.alert('Error', error?.message || 'Failed to cancel pickup');
            } finally {
              setIsCancelingPickup(false);
            }
          },
        },
      ],
    );
  };

  const handleCancelShipment = async () => {
    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }

    Alert.alert(
      'Confirm Cancel Shipment',
      'Are you sure you want to cancel this shipment? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelingShipment(true);
              await orderShipmentGroupService.cancelShiprocketOrder({
                shipmentgroupid: ordershipmentgroupid,
              });
              
              Alert.alert('Success', 'Shipment cancelled successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Error canceling shipment:', error);
              Alert.alert('Error', error?.message || 'Failed to cancel shipment');
            } finally {
              setIsCancelingShipment(false);
            }
          },
        },
      ],
    );
  };

  const handleItemPicked = async () => {
    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }
    try {
      setIsPicking(true);
      await orderShipmentGroupService.itemPicked({
        ordershipmentgroupid,
        notes: '',
      });
      Alert.alert('Success', 'Items marked as picked', [
        {
          text: 'OK',
          onPress: () => {
            loadShipmentData();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error marking items as picked:', error);
      Alert.alert('Error', error?.message || 'Failed to update picked status');
    } finally {
      setIsPicking(false);
    }
  };

  const handleItemChecked = async () => {
    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }
    try {
      setIsChecking(true);
      await orderShipmentGroupService.itemChecked({
        ordershipmentgroupid,
        notes: '',
      });
      Alert.alert('Success', 'Items marked as checked', [
        {
          text: 'OK',
          onPress: () => {
            loadShipmentData();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error marking items as checked:', error);
      Alert.alert('Error', error?.message || 'Failed to update checked status');
    } finally {
      setIsChecking(false);
    }
  };

  const handleItemPacked = async () => {
    if (!ordershipmentgroupid || ordershipmentgroupid <= 0) {
      Alert.alert('Error', 'Invalid shipment group ID');
      return;
    }
    try {
      setIsPacking(true);
      await orderShipmentGroupService.itemPacked({
        ordershipmentgroupid,
        notes: '',
      });
      Alert.alert('Success', 'Items marked as packed', [
        {
          text: 'OK',
          onPress: () => {
            loadShipmentData();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error marking items as packed:', error);
      Alert.alert('Error', error?.message || 'Failed to update packed status');
    } finally {
      setIsPacking(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
        <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[$.mt_3, $.h5, {color: Colors.textSecondary}]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shipmentData) {
    return (
      <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
        <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <Text style={[$.h5, {color: Colors.textSecondary}]}>No shipment data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ordersToShow = ordershipmentgroupid > 0 
    ? shipmentData.orderlist 
    : shipmentData.eligibleorderlist;

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      <KeyboardAvoidingView
        style={$.flex_1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView
        style={[$.flex_1, $.px_3, $.py_2]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[$.pb_4]}>
        <View style={[$.mb_2]}>
          <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, {marginBottom: 2}]}>
            {ordershipmentgroupid > 0 ? 'Update Shipment' : 'Create Shipment'}
          </Text>
          <Text style={[$.h7, {color: Colors.textSecondary}]}>
            Order Group: {ordergroupid}
          </Text>
        </View>

        {/* Partner Selection */}
        <View style={[$.mb_2]}>
          <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
            Partner
          </Text>
          {ordershipmentgroupid > 0 ? (
            <View style={[styles.partnerSelector, {marginBottom: 8, opacity: 0.6}]}>
              <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                {shipmentData.partnerlist.find(p => p.value === selectedPartner)?.label || 'Select Partner'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.partnerSelector, {marginBottom: 8}]}
              onPress={() => setShowPartnerSheet(true)}>
              <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                {shipmentData.partnerlist.find(p => p.value === selectedPartner)?.label || 'Select Partner'}
              </Text>
              <Text style={[$.h6, {color: Colors.textSecondary}]}>▼</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Partner Name - Only show for Custom partner */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Custom && (
          <View style={[$.mb_2]}>
          <FormInput
              label="Custom Partner Name"
              value={customPartnerName}
              onChangeText={setCustomPartnerName}
              placeholder="Enter partner name"
            editable={!isSubmitting && ordershipmentgroupid === 0}
          />
          </View>
        )}

        {/* Pickup Location - Only show for Shiprocket */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket && (
          <View style={[$.mb_2]}>
          <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
            Pickup Location
          </Text>
          {shipmentData.shiprocketpickuplocationlist.length > 0 ? (
            shipmentData.shiprocketpickuplocationlist.map((location, index) => (
              ordershipmentgroupid > 0 ? (
                <View
                  key={index}
                  style={[
                    styles.locationItem,
                    pickupLocation === location.locationname && styles.locationItemSelected,
                    {marginBottom: 6, opacity: 0.6},
                  ]}>
                  <Text style={[$.h7, $.font_weight_600, {color: Colors.text}]}>{location.locationname}</Text>
                  <Text style={[$.h7, {color: Colors.textSecondary, fontSize: 11}]}>Pincode: {location.pincode}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationItem,
                    pickupLocation === location.locationname && styles.locationItemSelected,
                    {marginBottom: 6},
                  ]}
                  onPress={() => {
                    setPickupLocation(location.locationname);
                    setPickupLocationPincode(location.pincode);
                  }}>
                  <Text style={[$.h7, $.font_weight_600, {color: Colors.text}]}>{location.locationname}</Text>
                  <Text style={[$.h7, {color: Colors.textSecondary, fontSize: 11}]}>Pincode: {location.pincode}</Text>
                </TouchableOpacity>
              )
            ))
          ) : (
            <Text style={[$.h6, {color: Colors.textSecondary}]}>No pickup locations available</Text>
          )}
        </View>
        )}

        {/* Orders Selection */}
        <View style={[$.mb_2]}>
          <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
            Orders ({selectedOrders.length} selected)
          </Text>
          {ordersToShow.map((order) => {
            if (ordershipmentgroupid > 0) {
              return (
                <View
                  key={order.orderid}
                  style={[styles.orderItem, {marginBottom: 6, opacity: 0.6}]}>
                  <View style={styles.orderItemContent}>
                    <View style={styles.checkbox}>
                      {selectedOrders.includes(order.orderid) && (
                        <View style={styles.checkboxSelected} />
                      )}
                    </View>
                    {order.fileid > 0 && (
                      <Image
                        source={{uri: getImageUrl(order.fileid)}}
                        style={styles.orderImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.orderDetails}>
                      <Text style={[$.h7, $.font_weight_600, {color: Colors.text}]}>
                        Order #{order.orderid}
                      </Text>
                      {order.designcode && (
                        <Text style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]} numberOfLines={1}>
                          {order.designcode}
                        </Text>
                      )}
                      <Text style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]}>
                        Qty: {order.orderquantity} | {formatPrice(order.ordernetprice)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity
                  key={order.orderid}
                  style={[styles.orderItem, {marginBottom: 6}]}
                  onPress={() => toggleOrderSelection(order.orderid)}>
                  <View style={styles.orderItemContent}>
                    <View style={styles.checkbox}>
                      {selectedOrders.includes(order.orderid) && (
                        <View style={styles.checkboxSelected} />
                      )}
                    </View>
                    {order.fileid > 0 && (
                      <Image
                        source={{uri: getImageUrl(order.fileid)}}
                        style={styles.orderImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.orderDetails}>
                      <Text style={[$.h7, $.font_weight_600, {color: Colors.text}]}>
                        Order #{order.orderid}
                      </Text>
                      {order.designcode && (
                        <Text style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]} numberOfLines={1}>
                          {order.designcode}
                        </Text>
                      )}
                      <Text style={[$.h7, {color: Colors.textSecondary, marginTop: 2}]}>
                        Qty: {order.orderquantity} | {formatPrice(order.ordernetprice)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          })}
        </View>

        {/* Package Details - Only show for Shiprocket */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket && (
          <View style={[$.mb_2]}>
            <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
              Package Details
            </Text>
          <View style={styles.packageRow}>
            <View style={styles.packageField}>
              <FormInput
                label="Length"
                value={packageLength}
                onChangeText={setPackageLength}
                placeholder="cm"
                keyboardType="numeric"
                editable={!isSubmitting && ordershipmentgroupid === 0}
              />
            </View>
            <View style={styles.packageField}>
              <FormInput
                label="Breadth"
                value={packageBreadth}
                onChangeText={setPackageBreadth}
                placeholder="cm"
                keyboardType="numeric"
                editable={!isSubmitting && ordershipmentgroupid === 0}
              />
            </View>
          </View>
          <View style={styles.packageRow}>
            <View style={styles.packageField}>
              <FormInput
                label="Height"
                value={packageHeight}
                onChangeText={setPackageHeight}
                placeholder="cm"
                keyboardType="numeric"
                editable={!isSubmitting && ordershipmentgroupid === 0}
              />
            </View>
            <View style={styles.packageField}>
              <FormInput
                label="Weight"
                value={packageWeight}
                onChangeText={setPackageWeight}
                placeholder="kg"
                keyboardType="numeric"
                editable={!isSubmitting && ordershipmentgroupid === 0}
              />
            </View>
          </View>
          </View>
        )}

        {/* Available Couriers - Only show for Shiprocket with existing shipment */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.shiprocketavailablecouriercompanylist &&
         shipmentData.shiprocketavailablecouriercompanylist.length > 0 && (
          <View style={[$.mb_2]}>
            <Text style={[$.h7, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
              Available Couriers
            </Text>
            {shipmentData.shiprocketavailablecouriercompanylist.map((courier, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.courierItem,
                  selectedCourierId === courier.courier_company_id && styles.courierItemSelected,
                  {marginBottom: 6},
                ]}
                onPress={() => setSelectedCourierId(courier.courier_company_id)}>
                <View style={styles.courierContent}>
                  <View style={styles.checkbox}>
                    {selectedCourierId === courier.courier_company_id && (
                      <View style={styles.checkboxSelected} />
                    )}
                  </View>
                  <View style={styles.courierDetails}>
                    <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                      {courier.courier_name}
                    </Text>
                    <View style={[$.flex_row, $.justify_content_spaceBetween, $.mt_1]}>
                      <Text style={[$.h7, {color: Colors.textSecondary}]}>
                        ₹{courier.rate.toFixed(2)}
                      </Text>
                      {courier.etd && (
                        <Text style={[$.h7, {color: Colors.textSecondary}]}>
                          ETD: {courier.etd}
                        </Text>
                      )}
                      {courier.rating && (
                        <Text style={[$.h7, {color: Colors.textSecondary}]}>
                          ⭐ {courier.rating}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Create/Update Button - Only show if shipment doesn't exist */}
        {ordershipmentgroupid === 0 && (
          <TouchableOpacity
            style={[
              styles.createButton,
              {backgroundColor: ColorPalette.primary},
              $.mb_2,
            ]}
            onPress={handleCreateShipment}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Create Shipment
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Item lifecycle buttons: Picked -> Checked -> Packed */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.OrderCreated && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.secondaryDark},
              {marginBottom: 8},
            ]}
            onPress={handleItemPicked}
            disabled={isPicking}>
            {isPicking ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Mark as Picked
              </Text>
            )}
          </TouchableOpacity>
        )}

        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.ItemPicked && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.primaryDark},
              {marginBottom: 8},
            ]}
            onPress={handleItemChecked}
            disabled={isChecking}>
            {isChecking ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Mark as Checked
              </Text>
            )}
          </TouchableOpacity>
        )}

        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.ItemChecked && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.primary},
              {marginBottom: 8},
            ]}
            onPress={handleItemPacked}
            disabled={isPacking}>
            {isPacking ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Mark as Packed
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Request Pickup Button - Only show for Shiprocket after Packed */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.ItemPacked && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.primary},
              {marginBottom: 8},
            ]}
            onPress={handleRequestPickup}
            disabled={isRequestingPickup || selectedCourierId <= 0}>
            {isRequestingPickup ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Request for Pickup
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Pickup Button - Only show for Shiprocket with PickupScheduled status */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.PickupScheduled && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.error},
              {marginBottom: 8},
            ]}
            onPress={handleCancelPickup}
            disabled={isCancelingPickup}>
            {isCancelingPickup ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Cancel Pickup
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Shipment Button - Show for Shiprocket when shipment exists and not already cancelled/delivered */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.Cancelled &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.Delivered &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.PickedUp &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.Shipped &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.InTransit &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus !== OrderShipmentGroup.OrderShipmentGroupStatus.OutForDelivery && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.error},
              $.mb_2,
            ]}
            onPress={handleCancelShipment}
            disabled={isCancelingShipment}>
            {isCancelingShipment ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h6, $.font_weight_600, {color: Colors.background}]}>
                Cancel Shipment
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Tracking Details - Show for Shiprocket when tracking data exists */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.shiprocketwebhookupdate &&
         shipmentData.ordershipmentgroup.shiprocketwebhookupdate.scans &&
         shipmentData.ordershipmentgroup.shiprocketwebhookupdate.scans.length > 0 && (
          <View style={[styles.trackingCard, $.mb_2]}>
            <Text style={[$.h6, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
              Tracking Details
            </Text>
            {shipmentData.ordershipmentgroup.shiprocketwebhookupdate.scans.map((scan, index) => {
              const isLast = index === shipmentData.ordershipmentgroup.shiprocketwebhookupdate!.scans!.length - 1;
              return (
                <View key={index} style={[styles.trackingItem, !isLast ? {marginBottom: 8} : {}]}>
                  <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_start]}>
                    <View style={[$.flex_1, $.mr_2]}>
                      <Text style={[$.h7, $.font_weight_600, {color: Colors.text}]}>
                        {scan.activity}
                      </Text>
                      {scan.location && (
                        <Text style={[$.h7, {color: Colors.textSecondary, marginTop: 2, fontSize: 11}]}>
                          📍 {scan.location}
                        </Text>
                      )}
                    </View>
                    <Text style={[$.h7, {color: Colors.textSecondary, fontSize: 11}]}>
                      {formatDateTime(scan.date)}
                    </Text>
                  </View>
                  {scan.status && (
                    <View style={[styles.statusTag, {marginTop: 4}]}>
                      <Text style={[$.h7, {color: Colors.textSecondary, fontSize: 11}]}>
                        {scan.status}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Partner Selection Bottom Sheet */}
      <BottomSheet
        visible={showPartnerSheet}
        onClose={() => setShowPartnerSheet(false)}
        height="40%">
        <View style={[$.mb_2]}>
          <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_2]}>
            Select Partner
          </Text>
          {shipmentData.partnerlist.map((partner) => (
            <TouchableOpacity
              key={partner.value}
              style={[
                styles.partnerSheetItem,
                selectedPartner === partner.value && styles.partnerSheetItemSelected,
                {marginBottom: 8},
              ]}
              onPress={() => {
                setSelectedPartner(partner.value);
                setShowPartnerSheet(false);
              }}>
              <Text style={[$.h6, {color: Colors.text}]}>
                {partner.label}
              </Text>
              {selectedPartner === partner.value && (
                <Text style={[$.h6, {color: Colors.primary}]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  locationItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  locationItemSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: ColorPalette.primaryLight + '20',
  },
  partnerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
    justifyContent: 'space-between',
  },
  partnerSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  partnerSheetItemSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: ColorPalette.primaryLight + '20',
  },
  orderItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  orderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  orderImage: {
    width: 50,
    height: 65,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: Colors.divider,
  },
  orderDetails: {
    flex: 1,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packageField: {
    flex: 1,
    marginHorizontal: 4,
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...$.shadow_medium,
  },
  courierItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  courierItemSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: ColorPalette.primaryLight + '20',
  },
  courierContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierDetails: {
    flex: 1,
    marginLeft: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    ...$.shadow_medium,
  },
  trackingCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  trackingItem: {
    paddingBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: 10,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
