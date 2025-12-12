import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
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
import {Image} from 'react-native';
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
      Alert.alert('Error', error?.message || 'Failed to request pickup');
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
      <ScrollView style={[$.flex_1, $.px_4, $.py_3]}>
        <View style={[$.mb_3]}>
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}, $.mb_1]}>
            {ordershipmentgroupid > 0 ? 'Update Shipment' : 'Create Shipment'}
          </Text>
          <Text style={[$.h7, {color: Colors.textSecondary}]}>
            Order Group: {ordergroupid}
          </Text>
        </View>

        {/* Partner Selection */}
        <View style={[$.mb_3]}>
          <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
            Partner
          </Text>
          {ordershipmentgroupid > 0 ? (
            <View style={[styles.partnerSelector, $.mb_2, {opacity: 0.6}]}>
              <Text style={[$.h6, {color: Colors.text, flex: 1}]}>
                {shipmentData.partnerlist.find(p => p.value === selectedPartner)?.label || 'Select Partner'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.partnerSelector, $.mb_2]}
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
          <View style={[$.mb_3]}>
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
          <View style={[$.mb_3]}>
          <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
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
                    $.mb_2,
                    {opacity: 0.6},
                  ]}>
                  <Text style={[$.h6, {color: Colors.text}]}>{location.locationname}</Text>
                  <Text style={[$.h7, {color: Colors.textSecondary}]}>Pincode: {location.pincode}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.locationItem,
                    pickupLocation === location.locationname && styles.locationItemSelected,
                    $.mb_2,
                  ]}
                  onPress={() => {
                    setPickupLocation(location.locationname);
                    setPickupLocationPincode(location.pincode);
                  }}>
                  <Text style={[$.h6, {color: Colors.text}]}>{location.locationname}</Text>
                  <Text style={[$.h7, {color: Colors.textSecondary}]}>Pincode: {location.pincode}</Text>
                </TouchableOpacity>
              )
            ))
          ) : (
            <Text style={[$.h6, {color: Colors.textSecondary}]}>No pickup locations available</Text>
          )}
        </View>
        )}

        {/* Orders Selection */}
        <View style={[$.mb_3]}>
          <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
            Orders ({selectedOrders.length} selected)
          </Text>
          {ordersToShow.map((order) => {
            if (ordershipmentgroupid > 0) {
              return (
                <View
                  key={order.orderid}
                  style={[styles.orderItem, $.mb_2, {opacity: 0.6}]}>
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
                      <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                        Order #{order.orderid}
                      </Text>
                      {order.designcode && (
                        <Text style={[$.h6, {color: Colors.textSecondary}]}>
                          Design: {order.designcode}
                        </Text>
                      )}
                      <Text style={[$.h6, {color: Colors.textSecondary}]}>
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
                  style={[styles.orderItem, $.mb_2]}
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
                      <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                        Order #{order.orderid}
                      </Text>
                      {order.designcode && (
                        <Text style={[$.h6, {color: Colors.textSecondary}]}>
                          Design: {order.designcode}
                        </Text>
                      )}
                      <Text style={[$.h6, {color: Colors.textSecondary}]}>
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
          <View style={[$.mb_3]}>
            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
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
          <View style={[$.mb_3]}>
            <Text style={[$.h6, $.font_weight_600, {color: Colors.text}, $.mb_1]}>
              Available Couriers
            </Text>
            {shipmentData.shiprocketavailablecouriercompanylist.map((courier, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.courierItem,
                  selectedCourierId === courier.courier_company_id && styles.courierItemSelected,
                  $.mb_2,
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

        {/* Create/Update Button - Only show if shipment doesn't exist or can be updated */}
        {ordershipmentgroupid === 0 && (
          <TouchableOpacity
            style={[
              styles.createButton,
              {backgroundColor: ColorPalette.primary},
              $.mb_3,
            ]}
            onPress={handleCreateShipment}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
                Create Shipment
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Request Pickup Button - Only show for Shiprocket with OrderCreated status */}
        {selectedPartner === OrderShipmentGroup.OrderShipmentGroupPartners.Shiprocket &&
         ordershipmentgroupid > 0 &&
         shipmentData.ordershipmentgroup.ordershipmentgroupstatus === OrderShipmentGroup.OrderShipmentGroupStatus.OrderCreated && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: ColorPalette.primary},
              $.mb_2,
            ]}
            onPress={handleRequestPickup}
            disabled={isRequestingPickup || selectedCourierId <= 0}>
            {isRequestingPickup ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
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
              $.mb_2,
            ]}
            onPress={handleCancelPickup}
            disabled={isCancelingPickup}>
            {isCancelingPickup ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
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
              $.mb_3,
            ]}
            onPress={handleCancelShipment}
            disabled={isCancelingShipment}>
            {isCancelingShipment ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={[$.h5, $.font_weight_600, {color: Colors.background}]}>
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
          <View style={[styles.trackingCard, $.mb_3]}>
            <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
              Tracking Details
            </Text>
            {shipmentData.ordershipmentgroup.shiprocketwebhookupdate.scans.map((scan, index) => {
              const isLast = index === shipmentData.ordershipmentgroup.shiprocketwebhookupdate!.scans!.length - 1;
              return (
                <View key={index} style={[styles.trackingItem, !isLast ? $.mb_2 : {}]}>
                  <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_start, $.mb_1]}>
                    <View style={[$.flex_1, $.mr_2]}>
                      <Text style={[$.h6, $.font_weight_600, {color: Colors.text}]}>
                        {scan.activity}
                      </Text>
                      {scan.location && (
                        <Text style={[$.h7, {color: Colors.textSecondary}, $.mt_1]}>
                          📍 {scan.location}
                        </Text>
                      )}
                    </View>
                    <Text style={[$.h7, {color: Colors.textSecondary}]}>
                      {formatDateTime(scan.date)}
                    </Text>
                  </View>
                  {scan.status && (
                    <View style={[styles.statusTag, $.mt_1]}>
                      <Text style={[$.h7, {color: Colors.textSecondary}]}>
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

      {/* Partner Selection Bottom Sheet */}
      <BottomSheet
        visible={showPartnerSheet}
        onClose={() => setShowPartnerSheet(false)}
        height="40%">
        <View style={[$.mb_3]}>
          <Text style={[$.h4, $.font_weight_bold, {color: Colors.text}, $.mb_3]}>
            Select Partner
          </Text>
          {shipmentData.partnerlist.map((partner) => (
            <TouchableOpacity
              key={partner.value}
              style={[
                styles.partnerSheetItem,
                selectedPartner === partner.value && styles.partnerSheetItemSelected,
                $.mb_2,
              ]}
              onPress={() => {
                setSelectedPartner(partner.value);
                setShowPartnerSheet(false);
              }}>
              <Text style={[$.h5, {color: Colors.text}]}>
                {partner.label}
              </Text>
              {selectedPartner === partner.value && (
                <Text style={[$.h5, {color: Colors.primary}]}>✓</Text>
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
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    justifyContent: 'space-between',
  },
  partnerSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  orderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  orderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.divider,
  },
  orderDetails: {
    flex: 1,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  packageField: {
    flex: 1,
    marginHorizontal: 4,
  },
  createButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...$.shadow_medium,
  },
  courierItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 12,
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
    marginLeft: 12,
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
  trackingCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  trackingItem: {
    paddingBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});
