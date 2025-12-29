import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  OrderShipmentGroupCreateShipmentReq,
  OrderShipmentGroupCreateShipmentRes,
  OrderShipmentGroupAdminPanelOrderDetailShipmentReq,
  OrderShipmentGroupAdminPanelOrderDetailShipmentRes,
  OrderShipmentGroupInitiateShipmentForShiprocketReq,
  OrderShipmentGroupInitiateShipmentForShiprocketRes,
  OrderShipmentGroupCreateShiprocketOrderReq,
  OrderShipmentGroupCreateShiprocketOrderRes,
  OrderShipmentGroupCreateCustomOrderReq,
  OrderShipmentGroupCreateCustomOrderRes,
  OrderShipmentGroupRequestForShipmentPickupReq,
  OrderShipmentGroupCancelShiprocketShipmentReq,
  OrderShipmentGroupCancelShiprocketOrderReq,
  OrderShipmentGroupItemPickedReq,
  OrderShipmentGroupItemCheckedReq,
  OrderShipmentGroupItemPackedReq,
} from '../models/ordershipmentgroup.model';

export class OrderShipmentGroupService {
  // Get base URL directly from Redux store
  private getBaseUrl(): string {
    const store = require('../redux/store.redux').store;
    const state = store.getState();
    return state?.environment?.url || require('../utils/environment').environment.baseurl;
  }

  async createShipment(req: OrderShipmentGroupCreateShipmentReq): Promise<OrderShipmentGroupCreateShipmentRes> {
    try {
      const response = await axios.post(`${this.getBaseUrl()}/api/OrderShipmentGroup/CreateShipment`, req);
      return response.data;
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.createShipment:', error);
      throw error;
    }
  }

  async adminPanelOrderDetailShipment(
    req: OrderShipmentGroupAdminPanelOrderDetailShipmentReq
  ): Promise<OrderShipmentGroupAdminPanelOrderDetailShipmentRes> {
    try {
      const postData: ActionReq<OrderShipmentGroupAdminPanelOrderDetailShipmentReq> = new ActionReq<OrderShipmentGroupAdminPanelOrderDetailShipmentReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<OrderShipmentGroupAdminPanelOrderDetailShipmentRes>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/AdminPanelOrderDetailShipment`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.adminPanelOrderDetailShipment:', error);
      throw error;
    }
  }

  async initiateShipmentForShiprocket(
    req: OrderShipmentGroupInitiateShipmentForShiprocketReq
  ): Promise<OrderShipmentGroupInitiateShipmentForShiprocketRes> {
    try {
      const postData: ActionReq<OrderShipmentGroupInitiateShipmentForShiprocketReq> = new ActionReq<OrderShipmentGroupInitiateShipmentForShiprocketReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<any>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/InitiateShipmentForShiprocket`,
        postData
      );
      if (resp.data.item) {
        return {ordershipmentgroupid: resp.data.item.id || 0};
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.initiateShipmentForShiprocket:', error);
      throw error;
    }
  }

  async createShiprocketOrder(
    req: OrderShipmentGroupCreateShiprocketOrderReq
  ): Promise<OrderShipmentGroupCreateShiprocketOrderRes> {
    try {
      const postData: ActionReq<OrderShipmentGroupCreateShiprocketOrderReq> = new ActionReq<OrderShipmentGroupCreateShiprocketOrderReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<OrderShipmentGroupCreateShiprocketOrderRes>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/CreateShiprocketOrder`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.createShiprocketOrder:', error);
      throw error;
    }
  }

  async createCustomOrder(
    req: OrderShipmentGroupCreateCustomOrderReq
  ): Promise<OrderShipmentGroupCreateCustomOrderRes> {
    try {
      const postData: ActionReq<OrderShipmentGroupCreateCustomOrderReq> = new ActionReq<OrderShipmentGroupCreateCustomOrderReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<OrderShipmentGroupCreateCustomOrderRes>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/CreateCustomOrder`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.createCustomOrder:', error);
      throw error;
    }
  }

  async requestForShipmentPickup(
    req: OrderShipmentGroupRequestForShipmentPickupReq
  ): Promise<any> {
    try {
      const postData: ActionReq<OrderShipmentGroupRequestForShipmentPickupReq> = new ActionReq<OrderShipmentGroupRequestForShipmentPickupReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<any>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/RequestForShipmentPickup`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.requestForShipmentPickup:', error);
      throw error;
    }
  }

  async cancelShiprocketShipment(
    req: OrderShipmentGroupCancelShiprocketShipmentReq
  ): Promise<any> {
    try {
      const postData: ActionReq<OrderShipmentGroupCancelShiprocketShipmentReq> = new ActionReq<OrderShipmentGroupCancelShiprocketShipmentReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<any>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/CancelShiprocketShipment`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.cancelShiprocketShipment:', error);
      throw error;
    }
  }

  async cancelShiprocketOrder(
    req: OrderShipmentGroupCancelShiprocketOrderReq
  ): Promise<any> {
    try {
      const postData: ActionReq<OrderShipmentGroupCancelShiprocketOrderReq> = new ActionReq<OrderShipmentGroupCancelShiprocketOrderReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<any>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/CancelShiprocketOrder`,
        postData
      );
      if (resp.data.item) {
        return resp.data.item;
      }
      throw new Error('No data returned from API');
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.cancelShiprocketOrder:', error);
      throw error;
    }
  }

  async itemPicked(req: OrderShipmentGroupItemPickedReq): Promise<boolean> {
    try {
      const postData: ActionReq<OrderShipmentGroupItemPickedReq> = new ActionReq<OrderShipmentGroupItemPickedReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<boolean>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/ItemPicked`,
        postData
      );
      return resp.data.item ?? false;
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.itemPicked:', error);
      throw error;
    }
  }

  async itemChecked(req: OrderShipmentGroupItemCheckedReq): Promise<boolean> {
    try {
      const postData: ActionReq<OrderShipmentGroupItemCheckedReq> = new ActionReq<OrderShipmentGroupItemCheckedReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<boolean>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/ItemChecked`,
        postData
      );
      return resp.data.item ?? false;
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.itemChecked:', error);
      throw error;
    }
  }

  async itemPacked(req: OrderShipmentGroupItemPackedReq): Promise<boolean> {
    try {
      const postData: ActionReq<OrderShipmentGroupItemPackedReq> = new ActionReq<OrderShipmentGroupItemPackedReq>();
      postData.item = req;
      const resp = await axios.post<ActionRes<boolean>>(
        `${this.getBaseUrl()}/api/OrderShipmentGroup/ItemPacked`,
        postData
      );
      return resp.data.item ?? false;
    } catch (error) {
      console.error('Error in OrderShipmentGroupService.itemPacked:', error);
      throw error;
    }
  }
}
