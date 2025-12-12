import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  Users,
  UsersSelectReq,
  UsersDeleteReq,
  UsersGetOtpReq,
  UsersValidateOtpReq,
  UsersValidateOtpRes,
  UsersRefreshTokenReq,
  UsersRefreshTokenRes,
  UserOrderConfirmReq,
  UserOrderPickedReq,
  UserOrderCheckedReq,
  UserOrderPackedReq,
  UserOrderRefundAndCancelReq,
  UserOrderCloseReq,
  UserOrderCancelReq,
  UserOrderReturnRefundReq,
  UserOrderShipmentGroupCreateShiprocketReturnOrderReq,
  UserOrderShipmentGroupCreateShiprocketReturnOrderRes,
} from '../models/users.model';

export class UsersService {
  // Get base URL directly from Redux store
  private getBaseUrl(): string {
    const store = require('../redux/store.redux').store;
    const state = store.getState();
    const baseurl = state?.environment?.url || require('../utils/environment').environment.baseurl;
    return baseurl + '/api/Users';
  }

  async select(req: UsersSelectReq): Promise<Array<Users>> {
    var result: Array<Users> = [];
    try {
      var postData: ActionReq<UsersSelectReq> = new ActionReq<UsersSelectReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<Users>>>(
        this.getBaseUrl() + '/Select',
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async saveWithDetails(req: Users): Promise<Users> {
    var result: Users = new Users();
    try {
      var postData: ActionReq<Users> = new ActionReq<Users>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Users>>(
        this.getBaseUrl() + '/saveWithDetails',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async insert(req: Users): Promise<Users> {
    var result: Users = new Users();
    try {
      var postData: ActionReq<Users> = new ActionReq<Users>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Users>>(
        this.getBaseUrl() + '/Insert',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async signUp(req: Users): Promise<Users> {
    var result: Users = new Users();
    try {
      var postData: ActionReq<Users> = new ActionReq<Users>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Users>>(
        this.getBaseUrl() + '/Signup',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async update(req: Users): Promise<Users> {
    var result: Users = new Users();
    try {
      var postData: ActionReq<Users> = new ActionReq<Users>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Users>>(
        this.getBaseUrl() + '/Update',
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async delete(req: UsersDeleteReq): Promise<boolean> {
    var result: boolean = false;
    try {
      var postData: ActionReq<UsersDeleteReq> = new ActionReq<UsersDeleteReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<boolean>>(
        this.getBaseUrl() + '/Delete',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getOtp(req: UsersGetOtpReq): Promise<number> {
    var result: number = 0;
    try {
      var postData: ActionReq<UsersGetOtpReq> = new ActionReq<UsersGetOtpReq>();
      postData.item = req;
      const baseUrl = this.getBaseUrl();
      console.log('UsersService.getOtp - baseUrl:', baseUrl);
      console.log('UsersService.getOtp - postData:', JSON.stringify(postData));
      var resp = await axios.post<ActionRes<number>>(
        baseUrl + '/GetOtp',
        postData
      );
      console.log('UsersService.getOtp - response:', JSON.stringify(resp.data));

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      console.error('UsersService.getOtp - error:', error);
      throw error;
    }
    return result;
  }

  async validateOtp(req: UsersValidateOtpReq): Promise<UsersValidateOtpRes> {
    var result: UsersValidateOtpRes = new UsersValidateOtpRes();
    try {
      var postData: ActionReq<UsersValidateOtpReq> =
        new ActionReq<UsersValidateOtpReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<UsersValidateOtpRes>>(
        this.getBaseUrl() + '/validateOtp',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async OrderConfirm(req: UserOrderConfirmReq): Promise<boolean> {
    var postData: ActionReq<UserOrderConfirmReq> =
      new ActionReq<UserOrderConfirmReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderConfirm',
      postData
    );

    return resp.data.item!;
  }

  async OrderPicked(req: UserOrderPickedReq): Promise<boolean> {
    var postData: ActionReq<UserOrderPickedReq> =
      new ActionReq<UserOrderPickedReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderPicked',
      postData
    );

    return resp.data.item!;
  }

  async OrderChecked(req: UserOrderCheckedReq): Promise<boolean> {
    var postData: ActionReq<UserOrderCheckedReq> =
      new ActionReq<UserOrderCheckedReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderChecked',
      postData
    );

    return resp.data.item!;
  }

  async OrderPacked(req: UserOrderPackedReq): Promise<boolean> {
    var postData: ActionReq<UserOrderPackedReq> =
      new ActionReq<UserOrderPackedReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderPacked',
      postData
    );

    return resp.data.item!;
  }

  async OrderRefundAndCancel(req: UserOrderRefundAndCancelReq): Promise<boolean> {
    var postData: ActionReq<UserOrderRefundAndCancelReq> =
      new ActionReq<UserOrderRefundAndCancelReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderRefundAndCancel',
      postData
    );

    return resp.data.item!;
  }

  async OrderClose(req: UserOrderCloseReq): Promise<boolean> {
    var postData: ActionReq<UserOrderCloseReq> =
      new ActionReq<UserOrderCloseReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderClose',
      postData
    );

    return resp.data.item!;
  }

  async OrderCancel(req: UserOrderCancelReq): Promise<boolean> {
    var postData: ActionReq<UserOrderCancelReq> =
      new ActionReq<UserOrderCancelReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderCancel',
      postData
    );

    return resp.data.item!;
  }

  async OrderShipmentGroupCreateShiprocketReturnOrder(
    req: UserOrderShipmentGroupCreateShiprocketReturnOrderReq
  ): Promise<UserOrderShipmentGroupCreateShiprocketReturnOrderRes> {
    var postData: ActionReq<UserOrderShipmentGroupCreateShiprocketReturnOrderReq> =
      new ActionReq<UserOrderShipmentGroupCreateShiprocketReturnOrderReq>();
    postData.item = req;
    var resp = await axios.post<
      ActionRes<UserOrderShipmentGroupCreateShiprocketReturnOrderRes>
    >(
      this.getBaseUrl() + '/OrderShipmentGroupCreateShiprocketReturnOrder',
      postData
    );

    return resp.data.item!;
  }

  async OrderReturnRefund(req: UserOrderReturnRefundReq): Promise<boolean> {
    var postData: ActionReq<UserOrderReturnRefundReq> =
      new ActionReq<UserOrderReturnRefundReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<boolean>>(
      this.getBaseUrl() + '/OrderReturnRefund',
      postData
    );

    return resp.data.item!;
  }

  async refreshToken(req: UsersRefreshTokenReq): Promise<UsersRefreshTokenRes> {
    var result: UsersRefreshTokenRes = new UsersRefreshTokenRes();
    try {
      var postData: ActionReq<UsersRefreshTokenReq> =
        new ActionReq<UsersRefreshTokenReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<UsersRefreshTokenRes>>(
        this.getBaseUrl() + '/RefreshToken',
        postData
      );

      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }
}
