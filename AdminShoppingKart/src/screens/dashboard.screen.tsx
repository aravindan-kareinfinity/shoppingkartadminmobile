import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  LineChart,
  PieChart,
} from 'react-native-chart-kit';
import moment from 'moment';
import {Colors, $} from '../styles';
import {HomeTabParamList} from '../hometab.navigation';
import {OrdersService} from '../services/orders.service';
import {
  OrderForWeekReq,
  ChartDataRes,
  ChartByCategory,
  OrdersForTodayRes,
  OrdersForYearRes,
  LatestOrderDTO,
  PopularOrdersRes,
} from '../models/orders.model';
import {environment} from '../utils/environment';
import {CustomIcon, CustomIcons} from '../components/customicons.component';
import {useAppDispatch} from '../redux';
import {logout} from '../redux/auth.redux';
import {clear} from '../redux/usercontext.redux';
import {authService} from '../services/auth.service';

type DashboardScreenNavigationProp = BottomTabNavigationProp<HomeTabParamList>;

const screenWidth = Dimensions.get('window').width;

// Light color palette for pie chart
const lightColors = [
  '#E3F2FD', // Light Blue
  '#F3E5F5', // Light Purple
  '#E8F5E9', // Light Green
  '#FFF3E0', // Light Orange
  '#FCE4EC', // Light Pink
  '#E0F2F1', // Light Teal
  '#FFF9C4', // Light Yellow
  '#F1F8E9', // Light Lime
  '#EDE7F6', // Light Deep Purple
  '#E1F5FE', // Light Cyan
  '#F9FBE7', // Light Lime Yellow
  '#FFF8E1', // Light Amber
  '#E8EAF6', // Light Indigo
  '#F5F5F5', // Light Grey
  '#FFEBEE', // Light Red
];

// Function to get light color by index
const getLightColor = (index: number): string => {
  return lightColors[index % lightColors.length];
};

export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(1); // 1: Today, 2: Week, 3: Month, 4: Year
  const [commonList, setCommonList] = useState<ChartDataRes[]>([]);
  const [categoryCommonList, setCategoryCommonList] = useState<ChartByCategory[]>([]);
  const [latestOrder, setLatestOrder] = useState<LatestOrderDTO[]>([]);
  const [popularOrdersList, setPopularOrdersList] = useState<PopularOrdersRes[]>([]);
  const [latestOrderCount, setLatestOrderCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [labelNameOne, setLabelNameOne] = useState('Orders');
  const [labelNameTwo, setLabelNameTwo] = useState('Revenue');

  const ordersService = new OrdersService();

  useEffect(() => {
    getToday(1);
    getLatestOrders();
  }, []);

  const getLatestOrders = async () => {
    try {
      // Reset data first
      setLatestOrder([]);
      setLatestOrderCount(0);
      
      const latest = await ordersService.getLatestOrders();
      setLatestOrder(latest || []);

      const request: OrderForWeekReq = new OrderForWeekReq();
      request.fromdate = moment().startOf('date').toDate();
      request.todate = moment().toDate();

      const todayOrders = await ordersService.getOrdersForToday(request);
      let count = 0;
      if (todayOrders && todayOrders.length > 0) {
        for (let i = 0; i < todayOrders.length; i++) {
          count += todayOrders[i].totalorders;
        }
      }
      setLatestOrderCount(count);
    } catch (error) {
      console.error('Error fetching latest orders:', error);
      // On error, reset data
      setLatestOrder([]);
      setLatestOrderCount(0);
    }
  };

  const getToday = async (tab: number) => {
    try {
      setIsLoading(true);
      setTabIndex(tab);
      
      // Reset all data first to clear previous data
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);

      const request: OrderForWeekReq = new OrderForWeekReq();
      request.fromdate = moment().local().startOf('date').toDate();
      request.todate = moment().local().toDate();

      const todayList = await ordersService.getOrdersForToday(request);

      if (todayList && todayList.length > 0) {
        const chartData = todayList.map(e => {
          let item = new ChartDataRes();
          item.labels = e.name;
          item.orders = e.totalquantity;
          item.revenue = e.totalnetprice;
          return item;
        });
        setCommonList(chartData);
        // Calculate total orders and revenue
        const totalOrdersCount = chartData.reduce((sum, item) => sum + item.orders, 0);
        const totalRevenueAmount = chartData.reduce((sum, item) => sum + item.revenue, 0);
        setTotalOrders(totalOrdersCount);
        setTotalRevenue(totalRevenueAmount);
        setLabelNameOne('Quantity');
        setLabelNameTwo('Revenue');
      } else {
        setCommonList([]);
        setTotalOrders(0);
        setTotalRevenue(0);
      }

      const categoryList = await ordersService.getOrdersByCategory(request);
      if (categoryList && categoryList.length > 0) {
        const categoryData = categoryList.map((e, index) => {
          let item = new ChartByCategory();
          item.name = e.name;
          item.quantitybycategory = e.totalbycategory;
          item.colourcode = getLightColor(index);
          return item;
        });
        setCategoryCommonList(categoryData);
      } else {
        setCategoryCommonList([]);
      }

      const popular = await ordersService.getPopularOrders(request);
      setPopularOrdersList(popular || []);
    } catch (error) {
      console.error('Error fetching today data:', error);
      // On error, ensure data is reset
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeek = async (tab: number) => {
    try {
      setIsLoading(true);
      setTabIndex(tab);
      
      // Reset all data first to clear previous data
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);

      const request: OrderForWeekReq = new OrderForWeekReq();
      request.fromdate = moment().startOf('week').toDate();
      request.todate = moment().toDate();

      const weekList = await ordersService.getOrdersForWeek(request);

      if (weekList && weekList.length > 0) {
        const chartData = weekList.map(e => {
          let item = new ChartDataRes();
          item.labels = e.dayname;
          item.orders = e.count;
          item.revenue = e.totalnetprice;
          return item;
        });
        setCommonList(chartData);
        // Calculate total orders and revenue
        const totalOrdersCount = chartData.reduce((sum, item) => sum + item.orders, 0);
        const totalRevenueAmount = chartData.reduce((sum, item) => sum + item.revenue, 0);
        setTotalOrders(totalOrdersCount);
        setTotalRevenue(totalRevenueAmount);
        setLabelNameOne('Orders');
        setLabelNameTwo('Revenue');
      } else {
        setCommonList([]);
        setTotalOrders(0);
        setTotalRevenue(0);
      }

      const categoryList = await ordersService.getOrdersByCategory(request);
      if (categoryList && categoryList.length > 0) {
        const categoryData = categoryList.map((e, index) => {
          let item = new ChartByCategory();
          item.name = e.name;
          item.quantitybycategory = e.totalbycategory;
          item.colourcode = getLightColor(index);
          return item;
        });
        setCategoryCommonList(categoryData);
      } else {
        setCategoryCommonList([]);
      }

      const popular = await ordersService.getPopularOrders(request);
      setPopularOrdersList(popular || []);
    } catch (error) {
      console.error('Error fetching week data:', error);
      // On error, ensure data is reset
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonth = async (tab: number) => {
    try {
      setIsLoading(true);
      setTabIndex(tab);
      
      // Reset all data first to clear previous data
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);

      const request: OrderForWeekReq = new OrderForWeekReq();
      request.fromdate = moment().startOf('month').toDate();
      request.todate = moment().toDate();

      const weekList = await ordersService.getOrdersForWeek(request);

      if (weekList && weekList.length > 0) {
        const chartData = weekList.map(e => {
          let item = new ChartDataRes();
          item.labels = e.dayname;
          item.orders = e.count;
          item.revenue = e.totalnetprice;
          return item;
        });
        setCommonList(chartData);
        // Calculate total orders and revenue
        const totalOrdersCount = chartData.reduce((sum, item) => sum + item.orders, 0);
        const totalRevenueAmount = chartData.reduce((sum, item) => sum + item.revenue, 0);
        setTotalOrders(totalOrdersCount);
        setTotalRevenue(totalRevenueAmount);
        setLabelNameOne('Orders');
        setLabelNameTwo('Revenue');
      } else {
        setCommonList([]);
        setTotalOrders(0);
        setTotalRevenue(0);
      }

      const categoryList = await ordersService.getOrdersByCategory(request);
      if (categoryList && categoryList.length > 0) {
        const categoryData = categoryList.map((e, index) => {
          let item = new ChartByCategory();
          item.name = e.name;
          item.quantitybycategory = e.totalbycategory;
          item.colourcode = getLightColor(index);
          return item;
        });
        setCategoryCommonList(categoryData);
      } else {
        setCategoryCommonList([]);
      }

      const popular = await ordersService.getPopularOrders(request);
      setPopularOrdersList(popular || []);
    } catch (error) {
      console.error('Error fetching month data:', error);
      // On error, ensure data is reset
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getYear = async (tab: number) => {
    try {
      setIsLoading(true);
      setTabIndex(tab);
      
      // Reset all data first to clear previous data
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);

      const request: OrderForWeekReq = new OrderForWeekReq();
      request.fromdate = moment().startOf('year').toDate();
      request.todate = moment().toDate();

      const yearList = await ordersService.getOrdersForYear(request);

      if (yearList && yearList.length > 0) {
        const chartData = yearList.map(e => {
          let item = new ChartDataRes();
          item.labels =
            e.monthname.charAt(0).toUpperCase() + e.monthname.slice(1);
          item.orders = e.count;
          item.revenue = e.totalnetprice;
          return item;
        });
        setCommonList(chartData);
        // Calculate total orders and revenue
        const totalOrdersCount = chartData.reduce((sum, item) => sum + item.orders, 0);
        const totalRevenueAmount = chartData.reduce((sum, item) => sum + item.revenue, 0);
        setTotalOrders(totalOrdersCount);
        setTotalRevenue(totalRevenueAmount);
        setLabelNameOne('Orders');
        setLabelNameTwo('Revenue');
      } else {
        setCommonList([]);
        setTotalOrders(0);
        setTotalRevenue(0);
      }

      const categoryList = await ordersService.getOrdersByCategory(request);
      if (categoryList && categoryList.length > 0) {
        const categoryData = categoryList.map((e, index) => {
          let item = new ChartByCategory();
          item.name = e.name;
          item.quantitybycategory = e.totalbycategory;
          item.colourcode = getLightColor(index);
          return item;
        });
        setCategoryCommonList(categoryData);
      } else {
        setCategoryCommonList([]);
      }

      const popular = await ordersService.getPopularOrders(request);
      setPopularOrdersList(popular || []);
    } catch (error) {
      console.error('Error fetching year data:', error);
      // On error, ensure data is reset
      setCommonList([]);
      setCategoryCommonList([]);
      setPopularOrdersList([]);
      setTotalOrders(0);
      setTotalRevenue(0);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: Colors.background,
    backgroundGradientFrom: Colors.background,
    backgroundGradientTo: Colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
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

  const getFileUrl = (fileId: number) => {
    return `${environment.baseurl}/api/Files/get?id=${fileId}`;
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
              // Navigation will be handled by AppNavigator based on isAuthenticated state
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[$.flex_1, {backgroundColor: Colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[$.h3, $.font_weight_bold, {color: Colors.text}]}>
          Dashboard
        </Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <CustomIcon name={CustomIcons.Logout} color={Colors.error} size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView style={[$.flex_1]}>
        {/* Date Filter Buttons */}
        <View style={[styles.buttonGroup, $.px_3, $.py_3]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tabIndex === 1 && styles.tabButtonActive,
            ]}
            onPress={() => getToday(1)}
            disabled={isLoading}>
            <Text
              style={[
                styles.tabButtonText,
                tabIndex === 1 && styles.tabButtonTextActive,
              ]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tabIndex === 2 && styles.tabButtonActive,
            ]}
            onPress={() => getWeek(2)}
            disabled={isLoading}>
            <Text
              style={[
                styles.tabButtonText,
                tabIndex === 2 && styles.tabButtonTextActive,
              ]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tabIndex === 3 && styles.tabButtonActive,
            ]}
            onPress={() => getMonth(3)}
            disabled={isLoading}>
            <Text
              style={[
                styles.tabButtonText,
                tabIndex === 3 && styles.tabButtonTextActive,
              ]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tabIndex === 4 && styles.tabButtonActive,
            ]}
            onPress={() => getYear(4)}
            disabled={isLoading}>
            <Text
              style={[
                styles.tabButtonText,
                tabIndex === 4 && styles.tabButtonTextActive,
              ]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={[$.flex_1, $.justify_content_center, $.align_items_center, {minHeight: 400}]}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Total Orders and Revenue Cards */}
            <View style={[$.px_3, $.mb_3, styles.statsContainer]}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <Text style={[styles.statLabel, {color: Colors.textSecondary}]}>
                  Total Orders
                </Text>
                <Text style={[styles.statValue, {color: Colors.text}]}>
                  {totalOrders.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.statCard, styles.statCardSecondary]}>
                <Text style={[styles.statLabel, {color: Colors.textSecondary}]}>
                  Total Revenue
                </Text>
                <Text style={[styles.statValue, {color: Colors.text}]}>
                  ₹{totalRevenue.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Charts Row */}
            <View style={[$.px_3, $.mb_4]}>
              <View style={[$.mb_3]}>
                <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
                  Overview
                </Text>
              </View>
              {commonList.length > 0 ? (
                <LineChart
                  data={{
                    labels: commonList.map(row => {
                      // For today, use full label; for others, use first 5 chars
                      if (tabIndex === 1) {
                        return row.labels;
                      }
                      return row.labels.slice(0, 5);
                    }),
                    datasets: [
                      {
                        data: commonList.map(row => row.orders),
                        color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // danger color
                        strokeWidth: 2,
                      },
                      {
                        data: commonList.map(row => {
                          // Normalize revenue to match orders scale for better visualization
                          // Since react-native-chart-kit doesn't support dual y-axes,
                          // we normalize revenue to the same scale as orders
                          const maxRevenue = Math.max(...commonList.map(r => r.revenue), 1);
                          const maxOrders = Math.max(...commonList.map(r => r.orders), 1);
                          if (maxRevenue > 0 && maxOrders > 0) {
                            return (row.revenue / maxRevenue) * maxOrders;
                          }
                          return row.revenue;
                        }),
                        color: (opacity = 1) => `rgba(244, 159, 42, ${opacity})`, // primary color #f49f2a
                        strokeWidth: 2,
                      },
                    ],
                    legend: [labelNameOne, labelNameTwo],
                  }}
                  width={screenWidth - 24}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    formatYLabel: (value) => {
                      // Format Y labels appropriately
                      const num = parseFloat(value);
                      if (num >= 1000) {
                        return (num / 1000).toFixed(1) + 'k';
                      }
                      return num.toFixed(0);
                    },
                  }}
                  bezier
                  style={styles.chart}
                  withDots={true}
                  withShadow={false}
                  withVerticalLines={true}
                  withHorizontalLines={true}
                />
              ) : (
                <View style={[styles.chartPlaceholder, {height: 220}]}>
                  <Text style={[$.h6, {color: Colors.textSecondary}]}>
                    No data available
                  </Text>
                </View>
              )}
            </View>

            {/* Sales By Category */}
            <View style={[$.px_3, $.mb_4]}>
              <View style={[$.mb_3]}>
                <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
                  Sales By Category
                </Text>
              </View>
              {categoryCommonList.length > 0 ? (
                <PieChart
                  data={categoryCommonList.map(item => ({
                    name: item.name,
                    population: item.quantitybycategory,
                    color: item.colourcode,
                    legendFontColor: Colors.text,
                    legendFontSize: 12,
                  }))}
                  width={screenWidth - 24}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              ) : (
                <View style={[styles.chartPlaceholder, {height: 220}]}>
                  <Text style={[$.h6, {color: Colors.textSecondary}]}>
                    No data available
                  </Text>
                </View>
              )}
            </View>

            {/* Best Sellers */}
            {popularOrdersList.length > 0 && (
              <View style={[$.px_3, $.mb_4]}>
                <View style={[$.mb_3]}>
                  <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
                    Best Sellers
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {popularOrdersList.map((item, index) => (
                    <View key={index} style={styles.productCard}>
                      {item.filelist && item.filelist.length > 0 && (
                        <Image
                          source={{uri: getFileUrl(item.filelist[0].fileid)}}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.productInfo}>
                        <Text
                          style={[$.h6, $.font_weight_600, {color: Colors.text}]}
                          numberOfLines={1}>
                          {item.designcode}
                        </Text>
                        <Text
                          style={[$.h6, {color: Colors.textSecondary}]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text
                          style={[$.h6, {color: Colors.textSecondary, fontSize: 12}]}
                          numberOfLines={1}>
                          {item.colour} | {item.brand}
                        </Text>
                        <Text style={[$.h5, $.font_weight_bold, {color: Colors.text, marginTop: 8}]}>
                          Rs. {item.netprice}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Latest Orders */}
            {latestOrder.length > 0 && (
              <View style={[$.px_3, $.mb_4]}>
                <View style={[styles.latestOrdersHeader, $.mb_3]}>
                  <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
                    Latest Orders
                  </Text>
                  <Text style={[$.h5, {color: Colors.text}]}>
                    {latestOrderCount}
                  </Text>
                </View>
                {latestOrder.map((item, index) => {
                  const fileId = item.fileid || (item.filelist && item.filelist.length > 0 ? item.filelist[0].fileid : 0);
                  return (
                    <View key={index} style={[styles.latestOrderItem, $.mb_2]}>
                      <View style={styles.latestOrderContent}>
                        {fileId > 0 && (
                          <Image
                            source={{uri: getFileUrl(fileId)}}
                            style={styles.latestOrderImage}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.latestOrderInfo}>
                          <Text style={[$.h6, {color: Colors.text}]}>
                            {item.designcode}
                          </Text>
                          <Text style={[$.h6, {color: Colors.textSecondary}]}>
                            {item.name}
                          </Text>
                          <Text style={[$.h5, $.font_weight_bold, {color: Colors.text}]}>
                            Rs. {item.netprice}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
  },
  productCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.divider,
  },
  productInfo: {
    padding: 12,
  },
  latestOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latestOrderItem: {
    padding: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
  },
  latestOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestOrderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.divider,
  },
  latestOrderInfo: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545', // danger color
  },
  statCardSecondary: {
    borderLeftWidth: 4,
    borderLeftColor: '#f49f2a', // primary color
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
