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
} from '../models/ordershipmentgroup.model';

export class OrderShipmentGroupService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.baseurl;
  }

  async createShipment(req: OrderShipmentGroupCreateShipmentReq): Promise<OrderShipmentGroupCreateShipmentRes> {
    const response = await axios.post(`${this.baseUrl}/api/OrderShipmentGroup/CreateShipment`, req);
    return response.data;
  }

  async adminPanelOrderDetailShipment(
    req: OrderShipmentGroupAdminPanelOrderDetailShipmentReq
  ): Promise<OrderShipmentGroupAdminPanelOrderDetailShipmentRes> {
    const postData: ActionReq<OrderShipmentGroupAdminPanelOrderDetailShipmentReq> = new ActionReq<OrderShipmentGroupAdminPanelOrderDetailShipmentReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<OrderShipmentGroupAdminPanelOrderDetailShipmentRes>>(
      `${this.baseUrl}/api/OrderShipmentGroup/AdminPanelOrderDetailShipment`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async initiateShipmentForShiprocket(
    req: OrderShipmentGroupInitiateShipmentForShiprocketReq
  ): Promise<OrderShipmentGroupInitiateShipmentForShiprocketRes> {
    const postData: ActionReq<OrderShipmentGroupInitiateShipmentForShiprocketReq> = new ActionReq<OrderShipmentGroupInitiateShipmentForShiprocketReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<any>>(
      `${this.baseUrl}/api/OrderShipmentGroup/InitiateShipmentForShiprocket`,
      postData
    );
    if (resp.data.item) {
      return {ordershipmentgroupid: resp.data.item.id || 0};
    }
    throw new Error('No data returned from API');
  }

  async createShiprocketOrder(
    req: OrderShipmentGroupCreateShiprocketOrderReq
  ): Promise<OrderShipmentGroupCreateShiprocketOrderRes> {
    const postData: ActionReq<OrderShipmentGroupCreateShiprocketOrderReq> = new ActionReq<OrderShipmentGroupCreateShiprocketOrderReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<OrderShipmentGroupCreateShiprocketOrderRes>>(
      `${this.baseUrl}/api/OrderShipmentGroup/CreateShiprocketOrder`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async createCustomOrder(
    req: OrderShipmentGroupCreateCustomOrderReq
  ): Promise<OrderShipmentGroupCreateCustomOrderRes> {
    const postData: ActionReq<OrderShipmentGroupCreateCustomOrderReq> = new ActionReq<OrderShipmentGroupCreateCustomOrderReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<OrderShipmentGroupCreateCustomOrderRes>>(
      `${this.baseUrl}/api/OrderShipmentGroup/CreateCustomOrder`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async requestForShipmentPickup(
    req: OrderShipmentGroupRequestForShipmentPickupReq
  ): Promise<any> {
    const postData: ActionReq<OrderShipmentGroupRequestForShipmentPickupReq> = new ActionReq<OrderShipmentGroupRequestForShipmentPickupReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<any>>(
      `${this.baseUrl}/api/OrderShipmentGroup/RequestForShipmentPickup`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async cancelShiprocketShipment(
    req: OrderShipmentGroupCancelShiprocketShipmentReq
  ): Promise<any> {
    const postData: ActionReq<OrderShipmentGroupCancelShiprocketShipmentReq> = new ActionReq<OrderShipmentGroupCancelShiprocketShipmentReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<any>>(
      `${this.baseUrl}/api/OrderShipmentGroup/CancelShiprocketShipment`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async cancelShiprocketOrder(
    req: OrderShipmentGroupCancelShiprocketOrderReq
  ): Promise<any> {
    const postData: ActionReq<OrderShipmentGroupCancelShiprocketOrderReq> = new ActionReq<OrderShipmentGroupCancelShiprocketOrderReq>();
    postData.item = req;
    const resp = await axios.post<ActionRes<any>>(
      `${this.baseUrl}/api/OrderShipmentGroup/CancelShiprocketOrder`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }
}
