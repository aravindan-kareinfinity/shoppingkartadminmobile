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

