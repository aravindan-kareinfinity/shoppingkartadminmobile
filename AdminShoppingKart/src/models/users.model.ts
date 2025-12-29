import { OrderAddressData } from './orders.model';
import { OrderShipmentGroup } from './ordershipmentgroup.model';

export class Users {
  id: number = 0;
  name: string = '';
  mobilenumber: string = '';
  email: string = '';
  isvendor: boolean = false;
  iscustomer: boolean = false;
  issystem: boolean = false;
  isvendorapproved: boolean = false;
  issystemapproved: boolean = false;
  isnewuser: boolean = false;
  wishlist: Users.WishlistData = new Users.WishlistData();
  cart: Users.CartData = new Users.CartData();
  gstno: string = '';
  vendorid: number = 0;
  version: number = 0;
  createdby: number = 0;
  createdon: Date = new Date();
  modifiedby: number = 0;
  modifiedon: Date = new Date();
  attributes: Users.AttributesData = new Users.AttributesData();
  isactive: boolean = false;
  issuspended: boolean = false;
  parentid: number = 0;
  isfactory: boolean = false;
  notes: string = '';
}

export namespace Users {
  export class AttributesData {
    gender: string = '';
    dob: Date = new Date();
    location: string = '';
    address: VendorAddressData = new VendorAddressData();
  }
  export class VendorAddressData {
    pincode: string = '';
    state: string = '';
    address: string = '';
    location: string = '';
    city: string = '';
  }
  export class AddressItemData {
    name: string = '';
    mobilenumber: string = '';
    email: string = '';
    pincode: string = '';
    state: string = '';
    address: string = '';
    location: string = '';
    city: string = '';
    type: string = '';
    isdefault: boolean = false;
  }
  export class WishlistData {
    itemlist: Array<number> = [];
  }

  export class CartData {
    itemlist: Array<CartItemData> = [];
    address: AddressItemData = new AddressItemData();
  }
  export class CartItemData {
    skuid: number = 0;
    quantity: number = 0;
  }
}

export class UsersSelectReq {
  id: number = 0;
  mobilenumber: string = '';
  vendorid: number = 0;
  isvendor: boolean | null = null;
  issystem: boolean | null = null;
}

export class UsersDeleteReq {
  id: number = 0;
  version: number = 0;
}

export class UsersGetOtpReq {
  mobilenumber: string = '';
  createuserifnotfound: boolean = false;
}

export class UsersValidateOtpReq {
  otpid: number = 0;
  otp: string = '';
}

export class UsersValidateOtpRes {
  accesstoken: string = '';
  refreshtoken: string = '';
  user: Users = new Users();
}

export class UsersRefreshTokenReq {
  refreshtoken: string = '';
}

export class UsersRefreshTokenRes {
  accesstoken: string = '';
  refreshtoken: string = '';
  user: Users = new Users();
}

export enum UserRoles {
  Customer = 1,
  Vendor = 2,
  System = 3,
}

export class UserSignUp extends Users {
  address: string = '';
}

export class UserOrderConfirmReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderPickedReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderCheckedReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderPackedReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderRefundAndCancelReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderCloseReq {
  orderid: number = 0;
}

export class UserOrderCancelReq {
  orderid: number = 0;
  notes: string = '';
}

export class UserOrderShipmentGroupCreateShiprocketReturnOrderReq {
  orderidlist: number[] = [];
  deliveryinformation: OrderAddressData = new OrderAddressData();
  shiprocketpackagedetails: OrderShipmentGroup.PackagedetailsData =
    new OrderShipmentGroup.PackagedetailsData();
}

export class UserOrderShipmentGroupCreateShiprocketReturnOrderRes {
  ordershipmentgroupid: number = 0;
}

export class UserOrderReturnRefundReq {
  orderid: number = 0;
  notes: string = '';
}

export class UsersContext {
  userid: number = 0;
  usermobile: string = '';
  username: string = '';
  useremail: string = '';
  vendorid: number = 0;
  accesstoken: string = '';
  refreshtoken: string = '';
  user: Users = new Users();
}

// Dashboard Models
export enum DateRangeFilterTypes {
  Today = 0,
  Yesterday = 1,
  Last7Days = 2,
  Last30Days = 3,
}

export enum OrderStatusViewTypes {
  ByIndividualOrder = 0,
  ByOrderGroup = 1,
}

export interface LabelValuePair<T> {
  label: string;
  value: T;
}

export function getDateRangeFilterTypes(): LabelValuePair<number>[] {
  return [
    {label: 'Today', value: DateRangeFilterTypes.Today},
    {label: 'Yesterday', value: DateRangeFilterTypes.Yesterday},
    {label: 'Last 7 days', value: DateRangeFilterTypes.Last7Days},
    {label: 'Last 30 days', value: DateRangeFilterTypes.Last30Days},
  ];
}

export class UserAdminPanelDashboardRevenueCardRes {
  totalrevenue: number = 0;
}

export class UserAdminPanelDashboardTotalOrderCardRes {
  oredercount: number = 0;
}

export class UserAdminPanelDashboardPendingOrderCardRes {
  oredercount: number = 0;
}

export class UserAdminPanelDashboardLowStockRes {
  lowstockcount: number = 0;
}

export class UsersAdminPanelDashboardIndividualOrderStatusChartData {
  status: number = 0;
  count: number = 0;
}

export class UsersAdminPanelDashboardGroupOrderStatusChartData {
  status: number = 0;
  groupcount: number = 0;
}

export class UsersAdminPanelDashboardOrderStatusChartRes {
  individualorderstatus: UsersAdminPanelDashboardIndividualOrderStatusChartData[] = [];
  grouporderstatus: UsersAdminPanelDashboardGroupOrderStatusChartData[] = [];
}

export class UsersAdminPanelDashboardNetSaleData {
  date: string = '';
  salevalue: number = 0;
}

export class UsersAdminPanelDashboardNetSaleChartRes {
  netsalelist: UsersAdminPanelDashboardNetSaleData[] = [];
}

export class UsersAdminPanelDashboardNetOrderData {
  date: string = '';
  ordercount: number = 0;
}

export class UsersAdminPanelDashboardNetOrderChartRes {
  netorderlist: UsersAdminPanelDashboardNetOrderData[] = [];
}

export class UsersAdminPanelDashboardTopProductData {
  productname: string = '';
  totalquantitysold: number = 0;
}

export class UsersAdminPanelDashboardTopProductChartRes {
  topproductlist: UsersAdminPanelDashboardTopProductData[] = [];
}

export class UsersAdminPanelDashboardTopDesignsData {
  designname: string = '';
  totalquantitysold: number = 0;
}

export class UsersAdminPanelDashboardTopDesignsChartRes {
  topdesignlist: UsersAdminPanelDashboardTopDesignsData[] = [];
}

export class UsersAdminPanelDashboardOrderStatusChartReq {
  datefilter: DateRangeFilterTypes = DateRangeFilterTypes.Today;
  orderviewtype: OrderStatusViewTypes = OrderStatusViewTypes.ByIndividualOrder;
}

export class UserAdminPanelDashboardReq {
  iscustomdate: boolean = false;
  datefilter: DateRangeFilterTypes = DateRangeFilterTypes.Today;
  orderstastuchartreq: UsersAdminPanelDashboardOrderStatusChartReq =
    new UsersAdminPanelDashboardOrderStatusChartReq();
}

export class UserAdminPanelDashboardRes {
  revenuecarddata: UserAdminPanelDashboardRevenueCardRes =
    new UserAdminPanelDashboardRevenueCardRes();
  totalordercarddata: UserAdminPanelDashboardTotalOrderCardRes =
    new UserAdminPanelDashboardTotalOrderCardRes();
  pendingordercarddata: UserAdminPanelDashboardPendingOrderCardRes =
    new UserAdminPanelDashboardPendingOrderCardRes();
  lowstockdata: UserAdminPanelDashboardLowStockRes =
    new UserAdminPanelDashboardLowStockRes();
  orderstatuschartdata: UsersAdminPanelDashboardOrderStatusChartRes =
    new UsersAdminPanelDashboardOrderStatusChartRes();
  netsalechartdata: UsersAdminPanelDashboardNetSaleChartRes =
    new UsersAdminPanelDashboardNetSaleChartRes();
  netorderchartdata: UsersAdminPanelDashboardNetOrderChartRes =
    new UsersAdminPanelDashboardNetOrderChartRes();
  topproductdata: UsersAdminPanelDashboardTopProductChartRes =
    new UsersAdminPanelDashboardTopProductChartRes();
  topdesigndata: UsersAdminPanelDashboardTopDesignsChartRes =
    new UsersAdminPanelDashboardTopDesignsChartRes();
}

