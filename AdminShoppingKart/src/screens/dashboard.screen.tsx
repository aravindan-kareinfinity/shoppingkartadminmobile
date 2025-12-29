import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import moment from 'moment';
import {Colors, $} from '../styles';
import {HomeTabParamList} from '../hometab.navigation';
import {UsersService} from '../services/users.service';
import {
  DateRangeFilterTypes,
  OrderStatusViewTypes,
  UserAdminPanelDashboardReq,
  UserAdminPanelDashboardRes,
  UsersAdminPanelDashboardOrderStatusChartReq,
  getDateRangeFilterTypes,
} from '../models/users.model';
import {Orders} from '../models/orders.model';
import {useAppSelector} from '../redux/hooks.redux';
import {selectenvironment} from '../redux/environment.redux';
import {CustomIcon, CustomIcons} from '../components/customicons.component';
import {useAppDispatch} from '../redux';
import {logout} from '../redux/auth.redux';
import {clear} from '../redux/usercontext.redux';
import {authService} from '../services/auth.service';

type DashboardScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

const screenWidth = Dimensions.get('window').width;

// Color palette for charts
const chartColors = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
];

export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const environmentState = useAppSelector(selectenvironment);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<UserAdminPanelDashboardRes | null>(null);
  const [dateFilter, setDateFilter] = useState<DateRangeFilterTypes>(DateRangeFilterTypes.Today);
  const [orderStatusViewType, setOrderStatusViewType] = useState<OrderStatusViewTypes>(
    OrderStatusViewTypes.ByIndividualOrder
  );
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);

  const usersService = new UsersService();
  const dateRangeFilters = getDateRangeFilterTypes();

  useEffect(() => {
    getDashboardData();
  }, [dateFilter, orderStatusViewType]);

  const getDashboardData = async () => {
    try {
      setIsLoading(true);
      const req = new UserAdminPanelDashboardReq();
      req.datefilter = dateFilter;
      req.orderstastuchartreq.datefilter = dateFilter;
      req.orderstastuchartreq.orderviewtype = orderStatusViewType;

      const data = await usersService.AdminPanelDashboardDetail(req);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDateFilter = (filter: DateRangeFilterTypes) => {
    setDateFilter(filter);
    setShowDateFilterModal(false);
  };

  const onChangeOrderStatusView = async (viewType: OrderStatusViewTypes) => {
    if (viewType === orderStatusViewType) return;
    
    try {
      setIsLoading(true);
      setOrderStatusViewType(viewType);
      
      const req = new UsersAdminPanelDashboardOrderStatusChartReq();
      req.datefilter = dateFilter;
      req.orderviewtype = viewType;

      let chartData;
      if (viewType === OrderStatusViewTypes.ByOrderGroup) {
        chartData = await usersService.AdminPanelDashboardGrouplOrderStatusChart(req);
      } else {
        chartData = await usersService.AdminPanelDashboardIndividualOrderStatusChart(req);
      }

      if (dashboardData) {
        dashboardData.orderstatuschartdata = chartData;
        setDashboardData({...dashboardData});
      }
    } catch (error) {
      console.error('Error fetching order status chart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: Colors.background,
    backgroundGradientFrom: Colors.background,
    backgroundGradientTo: Colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(244, 159, 42, ${opacity})`, // Primary color
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              dispatch(logout());
              dispatch(clear());
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string): string => {
    return moment(dateString).format('MMM DD, YY');
  };

  const getOrderStatusName = (status: number): string => {
    return Orders.getOrderStatusName(status) || 'Unknown';
  };

  const getSelectedDateFilterLabel = (): string => {
    const filter = dateRangeFilters.find(f => f.value === dateFilter);
    return filter?.label || 'Today';
  };

  return (
    <SafeAreaView style={[$.flex_1, $.bg_background]}>
      {/* Header */}
      <View style={[$.flex_row, $.justify_content_spaceBetween, $.align_items_center, $.px_4, $.py_3, $.bg_background, $.border_bottom, $.border_default]}>
        <View style={[$.flex_1]}>
          <Text style={[$.h3, $.font_weight_bold, $.text_plain]}>
            Dashboard
          </Text>
        
        </View>
        <View style={[$.flex_row, $.align_items_center, $.gap_2]}>
          <TouchableOpacity
            style={[$.px_3, $.py_2, $.border_rounded_1, $.bg_inputbg, $.border, $.border_default]}
            onPress={() => setShowDateFilterModal(true)}
            activeOpacity={0.7}>
            <Text style={[$.h6, $.text_plain]}>
              {getSelectedDateFilterLabel()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[$.p_2, $.border_rounded_1]}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <CustomIcon name={CustomIcons.Logout} color={Colors.error} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !dashboardData ? (
        <View style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : dashboardData ? (
        <ScrollView style={[$.flex_1]} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View style={[$.px_3, $.py_4, $.flex_row, $.gap_3]}>
            <View style={[$.flex_1, $.p_3, $.border_rounded_2, $.bg_inputbg]}>
              <Text style={[$.h7, $.mb_1, $.font_weight_500, $.text_muted]}>
                Revenue
              </Text>
              <Text style={[$.h3, $.font_weight_bold, $.text_plain]}>
                ₹{dashboardData.revenuecarddata.totalrevenue.toLocaleString()}
              </Text>
            </View>
            <View style={[$.flex_1, $.p_3, $.border_rounded_2, $.bg_inputbg]}>
              <Text style={[$.h7, $.mb_1, $.font_weight_500, $.text_muted]}>
                Total orders
              </Text>
              <Text style={[$.h3, $.font_weight_bold, $.text_plain]}>
                {dashboardData.totalordercarddata.oredercount}
                <Text style={[$.h6, $.text_muted]}> orders</Text>
              </Text>
            </View>
          </View>

          <View style={[$.px_3, $.pb_4, $.flex_row, $.gap_3]}>
            <View style={[$.flex_1, $.p_3, $.border_rounded_2, $.bg_inputbg]}>
              <Text style={[$.h7, $.mb_1, $.font_weight_500, $.text_muted]}>
                Pending orders
              </Text>
              <Text style={[$.h3, $.font_weight_bold, $.text_plain]}>
                {dashboardData.pendingordercarddata.oredercount}
                <Text style={[$.h6, $.text_muted]}> orders</Text>
              </Text>
            </View>
            <View style={[$.flex_1, $.p_3, $.border_rounded_2, $.bg_inputbg]}>
              <Text style={[$.h7, $.mb_1, $.font_weight_500, $.text_muted]}>
                Low stock alert
              </Text>
              <Text style={[$.h3, $.font_weight_bold, $.text_plain]}>
                {dashboardData.lowstockdata.lowstockcount}
                <Text style={[$.h6, $.text_muted]}> stocks</Text>
              </Text>
            </View>
          </View>

          {/* Net Sale Chart */}
          <View style={[$.px_3, $.mb_4]}>
            <Text style={[$.h5, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Net Sale
            </Text>
            {dashboardData.netsalechartdata.netsalelist.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3]}>
                <LineChart
                  data={{
                    labels: dashboardData.netsalechartdata.netsalelist.map(item =>
                      formatDate(item.date)
                    ),
                    datasets: [
                      {
                        data: dashboardData.netsalechartdata.netsalelist.map(item => item.salevalue),
                        color: (opacity = 1) => `rgba(244, 159, 42, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    formatYLabel: (value) => {
                      const num = parseFloat(value);
                      if (num >= 1000000) {
                        return '₹' + (num / 1000000).toFixed(1) + 'M';
                      }
                      if (num >= 1000) {
                        return '₹' + (num / 1000).toFixed(1) + 'k';
                      }
                      return '₹' + num.toFixed(0);
                    },
                  }}
                  bezier
                  style={{marginVertical: 8, borderRadius: 16}}
                  withDots={true}
                  withShadow={false}
                  withVerticalLines={true}
                  withHorizontalLines={true}
                />
              </View>
            ) : (
              <View style={[$.justify_content_center, $.align_items_center, {height: 220}, $.bg_inputbg, $.border_rounded_2]}>
                <Text style={[$.h6, $.text_muted]}>No data available</Text>
              </View>
            )}
          </View>

          {/* Net Order Chart */}
          <View style={[$.px_3, $.mb_4]}>
            <Text style={[$.h5, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Net Order
            </Text>
            {dashboardData.netorderchartdata.netorderlist.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3]}>
                <LineChart
                  data={{
                    labels: dashboardData.netorderchartdata.netorderlist.map(item =>
                      formatDate(item.date)
                    ),
                    datasets: [
                      {
                        data: dashboardData.netorderchartdata.netorderlist.map(item => item.ordercount),
                        color: (opacity = 1) => `rgba(244, 159, 42, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{marginVertical: 8, borderRadius: 16}}
                  withDots={true}
                  withShadow={false}
                  withVerticalLines={true}
                  withHorizontalLines={true}
                />
              </View>
            ) : (
              <View style={[$.justify_content_center, $.align_items_center, {height: 220}, $.bg_inputbg, $.border_rounded_2]}>
                <Text style={[$.h6, $.text_muted]}>No data available</Text>
              </View>
            )}
          </View>

          {/* Top Products Chart */}
          <View style={[$.px_3, $.mb_4]}>
            <Text style={[$.h5, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Top Products
            </Text>
            {dashboardData.topproductdata.topproductlist.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3]}>
                <BarChart
                  data={{
                    labels: dashboardData.topproductdata.topproductlist.map(item =>
                      item.productname.length > 10
                        ? item.productname.substring(0, 10) + '...'
                        : item.productname
                    ),
                    datasets: [
                      {
                        data: dashboardData.topproductdata.topproductlist.map(item =>
                          item.totalquantitysold
                        ),
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  showValuesOnTopOfBars
                  style={{marginVertical: 8, borderRadius: 16}}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </View>
            ) : (
              <View style={[$.justify_content_center, $.align_items_center, {height: 220}, $.bg_inputbg, $.border_rounded_2]}>
                <Text style={[$.h6, $.text_muted]}>No data available</Text>
              </View>
            )}
          </View>

          {/* Top Designs Chart */}
          <View style={[$.px_3, $.mb_4]}>
            <Text style={[$.h5, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Top Designs
            </Text>
            {dashboardData.topdesigndata.topdesignlist.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3]}>
                <BarChart
                  data={{
                    labels: dashboardData.topdesigndata.topdesignlist.map(item =>
                      item.designname.length > 10
                        ? item.designname.substring(0, 10) + '...'
                        : item.designname
                    ),
                    datasets: [
                      {
                        data: dashboardData.topdesigndata.topdesignlist.map(item =>
                          item.totalquantitysold
                        ),
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  showValuesOnTopOfBars
                  style={{marginVertical: 8, borderRadius: 16}}
                  yAxisLabel=""
                  yAxisSuffix=""
                />
              </View>
            ) : (
              <View style={[$.justify_content_center, $.align_items_center, {height: 220}, $.bg_inputbg, $.border_rounded_2]}>
                <Text style={[$.h6, $.text_muted]}>No data available</Text>
              </View>
            )}
          </View>

          {/* Orders by Status Chart */}
          <View style={[$.px_3, $.mb_4]}>
            <Text style={[$.h5, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Orders by Statuses
            </Text>
            {orderStatusViewType === OrderStatusViewTypes.ByIndividualOrder &&
            dashboardData.orderstatuschartdata.individualorderstatus.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3, $.mb_3]}>
                <PieChart
                  data={dashboardData.orderstatuschartdata.individualorderstatus.map((item, index) => ({
                    name: getOrderStatusName(item.status),
                    population: item.count,
                    color: chartColors[index % chartColors.length],
                    legendFontColor: Colors.text,
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={{marginVertical: 8, borderRadius: 16}}
                />
              </View>
            ) : orderStatusViewType === OrderStatusViewTypes.ByOrderGroup &&
              dashboardData.orderstatuschartdata.grouporderstatus.length > 0 ? (
              <View style={[$.bg_inputbg, $.border_rounded_2, $.p_3, $.mb_3]}>
                <PieChart
                  data={dashboardData.orderstatuschartdata.grouporderstatus.map((item, index) => ({
                    name: item.status === 0 ? 'MIXED' : getOrderStatusName(item.status),
                    population: item.groupcount,
                    color: chartColors[index % chartColors.length],
                    legendFontColor: Colors.text,
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 48}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={{marginVertical: 8, borderRadius: 16}}
                />
              </View>
            ) : (
              <View style={[$.justify_content_center, $.align_items_center, {height: 220}, $.bg_inputbg, $.border_rounded_2, $.mb_3]}>
                <Text style={[$.h6, $.text_muted]}>No data available</Text>
              </View>
            )}

            {/* Order Status View Type Toggle */}
            <View style={[$.flex_row, $.gap_4, $.px_2]}>
              <TouchableOpacity
                style={[$.flex_row, $.align_items_center]}
                onPress={() => onChangeOrderStatusView(OrderStatusViewTypes.ByIndividualOrder)}
                activeOpacity={0.7}>
                <View
                  style={[
                    {
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Colors.primary,
                      marginRight: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  {orderStatusViewType === OrderStatusViewTypes.ByIndividualOrder && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: Colors.primary,
                      }}
                    />
                  )}
                </View>
                <Text style={[$.h6, $.text_muted]}>By orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[$.flex_row, $.align_items_center]}
                onPress={() => onChangeOrderStatusView(OrderStatusViewTypes.ByOrderGroup)}
                activeOpacity={0.7}>
                <View
                  style={[
                    {
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: Colors.primary,
                      marginRight: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}>
                  {orderStatusViewType === OrderStatusViewTypes.ByOrderGroup && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: Colors.primary,
                      }}
                    />
                  )}
                </View>
                <Text style={[$.h6, $.text_muted]}>By order groups</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Date Filter Bottom Sheet */}
      <Modal
        visible={showDateFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateFilterModal(false)}>
        <TouchableOpacity
          style={[$.flex_1, {backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end'}]}
          activeOpacity={1}
          onPress={() => setShowDateFilterModal(false)}>
          <View
            style={[
              $.bg_background,
              {borderTopLeftRadius: 16, borderTopRightRadius: 16},
              $.p_4,
            ]}
            onStartShouldSetResponder={() => true}>
            <Text style={[$.h4, $.font_weight_bold, $.text_plain, $.mb_3]}>
              Select Date Range
            </Text>
            {dateRangeFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  $.py_3,
                  $.px_4,
                  $.mb_2,
                  $.border_rounded_1,
                  $.bg_inputbg,
                  dateFilter === filter.value && [$.border_primary, {borderWidth: 2}],
                ]}
                onPress={() => onChangeDateFilter(filter.value)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    $.h5,
                    $.text_plain,
                    dateFilter === filter.value && [$.text_primary, $.font_weight_bold],
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[$.py_3, $.px_4, $.mt_2, $.border_rounded_1, $.bg_inputbg]}
              onPress={() => setShowDateFilterModal(false)}
              activeOpacity={0.7}>
              <Text style={[$.h5, $.text_plain, $.text_center]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
