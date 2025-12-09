export namespace OrderShipmentGroup {
  export enum OrderShipmentGroupStatus {
    None = 0,
    OrderCreated = 100,
    PickupScheduled = 200,
    PickedUp = 300,
    Shipped = 400,
    InTransit = 500,
    OutForDelivery = 600,
    DeliveryAttempted = 700,
    Delivered = 800,
    ReturnInitiated = 900,
    ReturnPickedUp = 1000,
    ReturnInTransit = 1100,
    ReturnDelivered = 1200,
    Cancelled = 1300,
  }

  export enum OrderShipmentGroupPartners {
    None = 0,
    Custom = 100,
    Shiprocket = 200,
  }

  export function getOrderShipmentGroupStatusName(status: number): string {
    switch (status) {
      case OrderShipmentGroupStatus.OrderCreated:
        return 'Order Created';
      case OrderShipmentGroupStatus.PickupScheduled:
        return 'Pickup Scheduled';
      case OrderShipmentGroupStatus.PickedUp:
        return 'PickedUp';
      case OrderShipmentGroupStatus.Shipped:
        return 'Shipped';
      case OrderShipmentGroupStatus.InTransit:
        return 'InTransit';
      case OrderShipmentGroupStatus.OutForDelivery:
        return 'OutForDelivery';
      case OrderShipmentGroupStatus.Delivered:
        return 'Delivered';
      case OrderShipmentGroupStatus.Cancelled:
        return 'Cancelled';
      default:
        return '';
    }
  }

  export class PackagedetailsData {
    length: number = 0;
    breadth: number = 0;
    height: number = 0;
    weight: number = 0;
  }
}

// Legacy export for backward compatibility
export enum OrderShipmentGroupStatus {
  None = 0,
  Initiated = 100,
  InTransit = 200,
  Delivered = 300,
  Cancelled = 400,
}

// Order Shipment Group Service Interfaces
export interface OrderShipmentGroupCreateShipmentReq {
  ordergroupid: number;
  ordershipmentgroupid: number;
  // Add other required fields based on your API
}

export interface OrderShipmentGroupCreateShipmentRes {
  ordershipmentgroupid: number;
  // Add other response fields
}

// Admin Panel Order Detail Shipment
export interface OrderShipmentGroupAdminPanelOrderDetailShipmentReq {
  ordergroupid: number;
  ordershipmentgroupid: number;
}

export interface OrderShipmentGroupAdminPanelOrderDetailShipmentRes {
  ordershipmentgroup: OrderShipmentGroupAdminPanelOrderDetailShipmentOrderShipmentGroup;
  eligibleorderlist: OrderShipmentGroupAdminPanelOrderDetailShipmentResOrder[];
  orderlist: OrderShipmentGroupAdminPanelOrderDetailShipmentResOrder[];
  shiprocketavailablecouriercompanylist: OrderShipmentGroupAvailableCourierCompany[];
  shiprocketpickuplocationlist: OrderShipmentGroupAdminPanelOrderDetailShipmentPickupLocation[];
  partnerlist: OrderShipmentGroupAdminPanelOrderDetailShipmentResPartner[];
}

export interface OrderShipmentGroupAdminPanelOrderDetailShipmentResPartner {
  label: string;
  value: number; // OrderShipmentGroupPartners enum
}

export interface OrderShipmentGroupAdminPanelOrderDetailShipmentPickupLocation {
  locationname: string;
  pincode: string;
  vendorid: number;
}

export interface OrderShipmentGroupTrackingScan {
  location: string;
  date: string;
  activity: string;
  status: string;
}

export interface OrderShipmentGroupShiprocketWebhookUpdate {
  shipment_status_id?: number;
  order_id?: string;
  scans?: OrderShipmentGroupTrackingScan[];
}

export interface OrderShipmentGroupAdminPanelOrderDetailShipmentOrderShipmentGroup {
  ordershipmentgroupid: number;
  ordershipmentgroupstatus: number;
  ordershipmentgroupstatusname: string;
  ordershipmentgrouptype: number;
  ordershipmentgrouppartner: number;
  ordershipmentgrouppartnername: string;
  shiprocketpickuplocationname: string;
  shiprocketpickuplocationpincode: string;
  shiprocketpackagedetails: OrderShipmentGroup.PackagedetailsData;
  pickupdetails: any; // OrderAddressData
  deliverydetails: any; // OrderAddressData
  paymentgroupstatus: number;
  shiprocketpickupscheduleddate: string;
  shiprocketpickupcouriername: string;
  custompartnername: string;
  custompartnertrackingurl: string;
  shiprocketwebhookupdate?: OrderShipmentGroupShiprocketWebhookUpdate | null;
}

export interface OrderShipmentGroupAdminPanelOrderDetailShipmentResOrder {
  orderid: number;
  orderquantity: number;
  orderunitnetprice: number;
  ordernetprice: number;
  orderstatus: number;
  orderstatusname: string;
  ordertype: number;
  designid: number;
  designcode: string;
  fileid: number;
  paymentmode: number;
  paymentmodename: string;
  paymentamount: number;
  paymentstatus: number;
  paymentstatusname: string;
}

// Initiate Shiprocket Shipment
export interface OrderShipmentGroupInitiateShipmentForShiprocketReq {
  orderidlist: number[];
  packagedetails: OrderShipmentGroup.PackagedetailsData;
  shiprocketpickuplocationname: string;
  shiprocketpickuplocationpincode: string;
}

export interface OrderShipmentGroupInitiateShipmentForShiprocketRes {
  ordershipmentgroupid: number;
  // Add other response fields
}

// Create Shiprocket Order
export interface OrderShipmentGroupCreateShiprocketOrderReq {
  orderidlist: number[];
  shiprocketpickuplocationname: string;
  shiprocketpickuplocationpincode: string;
  shiprocketpackagedetails: OrderShipmentGroup.PackagedetailsData;
}

export interface OrderShipmentGroupCreateShiprocketOrderRes {
  ordershipmentgroupid: number;
}

// Create Custom Order
export interface OrderShipmentGroupCreateCustomOrderReq {
  orderidlist: number[];
  custompartnername: string;
}

export interface OrderShipmentGroupCreateCustomOrderRes {
  ordershipmentgroupid: number;
}

// Available Courier Company
export interface OrderShipmentGroupAvailableCourierCompany {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  charge_weight?: number;
  freight_charge?: number;
  etd?: string;
  rating?: number;
  image?: string;
}

// Request for Shipment Pickup
export interface OrderShipmentGroupRequestForShipmentPickupReq {
  shipmentgroupid: number;
  courierid: number;
}

// Cancel Shiprocket Shipment
export interface OrderShipmentGroupCancelShiprocketShipmentReq {
  shipmentgroupid: number;
  note?: string;
}

// Cancel Shiprocket Order
export interface OrderShipmentGroupCancelShiprocketOrderReq {
  shipmentgroupid: number;
  note?: string;
}
