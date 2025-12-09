export enum OrderTypes {
  None = 0,
  Regular = 100,
  Return = 200,
}

export namespace Orders {
  export enum OrderStatuses {
    None = 0,
    Placed = 100,
    Confirmed = 200,
    Picked = 230,
    Checked = 260,
    Packed = 290,
    Shipped = 300,
    OutForDelivery = 400,
    Delivered = 500,
    RefundInitiated = 600,
    Refunded = 700,
    RefundFailed = 750,
    Cancelled = 800,
    PaymentFailed = 900,
    PaymentPending = 1000,
    Closed = 1100,
  }

  export function getOrderStatusName(status: number): string {
    switch (status) {
      case OrderStatuses.Placed:
        return 'Order Placed';
      case OrderStatuses.Confirmed:
        return 'Order Confirmed';
      case OrderStatuses.Picked:
        return 'Picked';
      case OrderStatuses.Checked:
        return 'Checked';
      case OrderStatuses.Packed:
        return 'Packed';
      case OrderStatuses.Shipped:
        return 'Shipped';
      case OrderStatuses.OutForDelivery:
        return 'OutForDelivery';
      case OrderStatuses.Delivered:
        return 'Delivered';
      case OrderStatuses.Cancelled:
        return 'Cancelled';
      case OrderStatuses.PaymentPending:
        return 'Payment Pending';
      case OrderStatuses.PaymentFailed:
        return 'Payment Failed';
      case OrderStatuses.Closed:
        return 'Closed';
      case OrderStatuses.RefundInitiated:
        return 'Refund Initiated';
      case OrderStatuses.Refunded:
        return 'Refunded';
      case OrderStatuses.RefundFailed:
        return 'Refund Failed';
      default:
        return '';
    }
  }

  export class OrderAddressData {
    name: string = '';
    mobile: string = '';
    email: string = '';
    address: string = '';
    pincode: string = '';
    state: string = '';
    locality: string = '';
    city: string = '';
  }
}

// Export OrderAddressData for use in other models
export class OrderAddressData {
  name: string = '';
  mobile: string = '';
  email: string = '';
  address: string = '';
  pincode: string = '';
  state: string = '';
  locality: string = '';
  city: string = '';
}

// Legacy exports for backward compatibility
export enum OrderStatuses {
  Placed = 100,
  Confirmed = 200,
  Picked = 300,
  Checked = 400,
  Packed = 500,
  Shipped = 600,
  Delivered = 700,
  Cancelled = 800,
  Refunded = 900,
}

export function getOrderStatusName(status: number): string {
  return Orders.getOrderStatusName(status) || 'Unknown';
}

export function getOrderStatusColor(status: number): {bg: string; text: string} {
  const colorMap: Record<number, {bg: string; text: string}> = {
    [Orders.OrderStatuses.Placed]: {bg: '#FFF3CD', text: '#856404'},
    [Orders.OrderStatuses.Confirmed]: {bg: '#D1ECF1', text: '#0C5460'},
    [Orders.OrderStatuses.Picked]: {bg: '#E7F3FF', text: '#004085'},
    [Orders.OrderStatuses.Checked]: {bg: '#FFF4E6', text: '#856404'},
    [Orders.OrderStatuses.Packed]: {bg: '#E8F5E9', text: '#2E7D32'},
    [Orders.OrderStatuses.Shipped]: {bg: '#D4EDDA', text: '#155724'},
    [Orders.OrderStatuses.OutForDelivery]: {bg: '#CCE5FF', text: '#004085'},
    [Orders.OrderStatuses.Delivered]: {bg: '#D1E7DD', text: '#0F5132'},
    [Orders.OrderStatuses.Cancelled]: {bg: '#F8D7DA', text: '#721C24'},
    [Orders.OrderStatuses.RefundInitiated]: {bg: '#FFF3CD', text: '#856404'},
    [Orders.OrderStatuses.Refunded]: {bg: '#F8D7DA', text: '#721C24'},
    [Orders.OrderStatuses.RefundFailed]: {bg: '#F8D7DA', text: '#721C24'},
    [Orders.OrderStatuses.PaymentPending]: {bg: '#FFF3CD', text: '#856404'},
    [Orders.OrderStatuses.PaymentFailed]: {bg: '#F8D7DA', text: '#721C24'},
    [Orders.OrderStatuses.Closed]: {bg: '#E2E3E5', text: '#383D41'},
  };
  return colorMap[status] || {bg: '#E2E3E5', text: '#383D41'};
}

// Dashboard models
export class OrderForWeekReq {
  fromdate: Date = new Date();
  todate: Date = new Date();
}

export class OrderForWeekRes {
  totalnetprice: number = 0;
  totalquantity: number = 0;
  count: number = 0;
  date: string = '';
  dayname: string = '';
}

export class ChartDataRes {
  orders: number = 0;
  revenue: number = 0;
  labels: string = '';
}

export class ChartByCategory {
  name: string = '';
  quantitybycategory: number = 0;
  colourcode: string = '';
}

export class OrdersForTodayRes {
  date: string = '';
  totalnetprice: number = 0;
  totalquantity: number = 0;
  name: string = '';
  totalorders: number = 0;
}

export class OrdersForYearRes {
  month: string = '';
  monthname: string = '';
  totalnetprice: number = 0;
  totalquantity: number = 0;
  count: number = 0;
}

export class SaleByCategoryResDTO {
  name: string = '';
  totalbycategory: number = 0;
}

export class LatestOrderDTO {
  designcode: string = '';
  name: string = '';
  netprice: number = 0;
  fileid: number = 0;
  filelist: Array<{fileid: number}> = [];
}

export class PopularOrdersRes {
  designcode: string = '';
  name: string = '';
  colour: string = '';
  brand: string = '';
  netprice: number = 0;
  filelist: Array<{fileid: number}> = [];
}

// Order Service Interfaces
export interface OrderGetWithDetailsReq {
  getall?: boolean;
  skuid?: number;
  orderid?: number;
}

export interface OrderGetWithDetailsRes {
  id: number;
  groupid?: number;
  designcode?: string;
  brandname?: string;
  colourname?: string;
  sizename?: string;
  quantity: number;
  netprice: number;
  status: number;
  type?: number;
  customername?: string;
  skudesignattributestring?: string;
  createdon: string;
}

export interface OrderAdminPanelOrderSummaryReq {
  orderid: number;
}

export interface OrderAdminPanelOrderSummaryRes {
  orderid: number;
  designcode?: string;
  designname?: string;
  brand?: string;
  colour?: string;
  size?: string;
  orderquantity: number;
  ordernetprice: number;
  orderstatus: number;
  customername?: string;
  customermobilenumber?: string;
  filelist?: Array<{fileid: number}>;
  paymentlist?: Array<{
    paymentmodename: string;
    paymentamount: number;
    paymentstatusname: string;
    paymenttypecodename: string;
  }>;
}

export interface OrderAdminPanelOrderDetailsV3StatusReq {
  orderid: number;
}

export interface OrderAdminPanelOrderDetailsV3StatusRes {
  orderid: number;
  orderstatus: number;
  ordertype: number;
  orderquantity: number;
  orderunitsaleprice?: number;
  orderunitnetprice?: number;
  ordersaleprice?: number;
  ordernetprice: number;
  designcode?: string;
  designid?: number;
  fileid: number;
  hascustomisation?: boolean;
  paymentgroupstatus: number;
  ordershipmentgroupstatus: number;
  cancancel?: boolean;
  canrefund?: boolean;
  skuattributelist?: Array<{
    attributeid?: number;
    attributename?: string;
    attributevalueid?: number;
    attributevaluename?: string;
    skudesignattributename?: string;
    skudesignattributevaluename?: string;
  }>;
  orderhistory?: {
    statushistory?: Array<{
      modifiedon: string;
      statusname?: string;
      status: number;
      Modifiedbyname?: string;
      notes?: string;
    }>;
  };
}

export interface OrderMoveToNextStatusReq {
  orderid: number;
  note?: string;
}

export interface OrdersGroupByVendorReq {
  vendorid?: number;
  fromdate?: Date;
  todate?: Date;
  getall?: boolean;
}

export interface OrdersGroupByVendorResDesignStatus {
  design?: string;
  designid?: number;
  designcode?: string;
  status?: number;
  order_netprice?: number;
  qty?: number;
}

export interface OrdersGroupByVendorRes {
  groupid: number;
  customerid?: number;
  customername?: string;
  createdon: string;
  modifiedon?: string;
  shippingcharge?: number;
  ordergroupnetprice?: number;
  design_status_list?: OrdersGroupByVendorResDesignStatus[];
}

// Order Group Service Interfaces
export interface OrderGroupAdminPanelOrderSummaryV3Req {
  ordergroupid: number;
}

export interface OrderGroupAdminPanelOrderSummaryV3Res {
  ordergroup: {
    ordergroupid: number;
    createdon: string;
    shippingcharge: number;
    totalprice: number;
    ordertype: number;
    deliveryinformation?: {
      name?: string;
      mobile?: string;
      email?: string;
    };
    pickupinformation?: {
      name?: string;
      mobile?: string;
    };
    completedeliveryaddress?: string;
    completepickupaddress?: string;
  };
  orderlist?: Array<{
    orderid: number;
    orderstatus: number;
    orderstatusname: string;
    designcode?: string;
    quantity: number;
    netprice: number;
    fileid?: number;
  }>;
  paymentlist?: Array<{
    paymentmodename: string;
    paymentamount: number;
    paymentstatusname: string;
    paymenttypecodename: string;
  }>;
  shipmentlist?: Array<{
    shipmentgroupid: number;
    statusname: string;
    ordercount: number;
  }>;
  cancreateshipment: boolean;
}
