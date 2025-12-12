import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  OrderForWeekReq,
  OrderForWeekRes,
  OrdersForTodayRes,
  OrdersForYearRes,
  SaleByCategoryResDTO,
  LatestOrderDTO,
  PopularOrdersRes,
  OrderGetWithDetailsReq,
  OrderGetWithDetailsRes,
  OrderAdminPanelOrderSummaryReq,
  OrderAdminPanelOrderSummaryRes,
  OrderAdminPanelOrderDetailsV3StatusReq,
  OrderAdminPanelOrderDetailsV3StatusRes,
  OrderMoveToNextStatusReq,
  OrdersGroupByVendorReq,
  OrdersGroupByVendorRes,
} from '../models/orders.model';

export class OrdersService {
  // Get base URL directly from Redux store
  private getBaseUrl(): string {
    const store = require('../redux/store.redux').store;
    const state = store.getState();
    return state?.environment?.url || require('../utils/environment').environment.baseurl;
  }

  async getWithDetails(req: OrderGetWithDetailsReq): Promise<OrderGetWithDetailsRes[]> {
    const response = await axios.post(`${this.getBaseUrl()}/api/Orders/GetWithDetails`, req);
    return response.data;
  }

  async adminPanelOrderSummary(req: OrderAdminPanelOrderSummaryReq): Promise<OrderAdminPanelOrderSummaryRes> {
    const response = await axios.post(`${this.getBaseUrl()}/api/Orders/AdminPanelOrderSummary`, req);
    return response.data;
  }

  async adminPanelOrderDetailsV3Status(req: OrderAdminPanelOrderDetailsV3StatusReq): Promise<OrderAdminPanelOrderDetailsV3StatusRes> {
    var postData: ActionReq<OrderAdminPanelOrderDetailsV3StatusReq> = new ActionReq<OrderAdminPanelOrderDetailsV3StatusReq>();
    postData.item = req;
    var resp = await axios.post<ActionRes<OrderAdminPanelOrderDetailsV3StatusRes>>(
      `${this.getBaseUrl()}/api/Orders/AdminPanelOrderDetailsV3Status`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }

  async moveToNextStatus(req: OrderMoveToNextStatusReq): Promise<any> {
    const response = await axios.post(`${this.getBaseUrl()}/api/Orders/MoveToNextStatus`, req);
    return response.data;
  }

  // Dashboard methods
  async getOrdersForWeek(req: OrderForWeekReq): Promise<Array<OrderForWeekRes>> {
    var result: Array<OrderForWeekRes> = [];
    try {
      var postData: ActionReq<OrderForWeekReq> = new ActionReq<OrderForWeekReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<OrderForWeekRes>>>(
        `${this.getBaseUrl()}/api/Orders/getWeeklyOrders`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getOrdersForToday(req: OrderForWeekReq): Promise<Array<OrdersForTodayRes>> {
    var result: Array<OrdersForTodayRes> = [];
    try {
      var postData: ActionReq<OrderForWeekReq> = new ActionReq<OrderForWeekReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<OrdersForTodayRes>>>(
        `${this.getBaseUrl()}/api/Orders/getTodayOrders`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getOrdersForYear(req: OrderForWeekReq): Promise<Array<OrdersForYearRes>> {
    var result: Array<OrdersForYearRes> = [];
    try {
      var postData: ActionReq<OrderForWeekReq> = new ActionReq<OrderForWeekReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<OrdersForYearRes>>>(
        `${this.getBaseUrl()}/api/Orders/getYearOrders`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getOrdersByCategory(req: OrderForWeekReq): Promise<Array<SaleByCategoryResDTO>> {
    var result: Array<SaleByCategoryResDTO> = [];
    try {
      var postData: ActionReq<OrderForWeekReq> = new ActionReq<OrderForWeekReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<SaleByCategoryResDTO>>>(
        `${this.getBaseUrl()}/api/Orders/saleByCategory`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getLatestOrders(): Promise<Array<LatestOrderDTO>> {
    var result: Array<LatestOrderDTO> = [];
    try {
      var resp = await axios.get<ActionRes<Array<LatestOrderDTO>>>(
        `${this.getBaseUrl()}/api/Orders/getLatestOrders`
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getPopularOrders(req: OrderForWeekReq): Promise<Array<PopularOrdersRes>> {
    var result: Array<PopularOrdersRes> = [];
    try {
      var postData: ActionReq<OrderForWeekReq> = new ActionReq<OrderForWeekReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<PopularOrdersRes>>>(
        `${this.getBaseUrl()}/api/Orders/getPopularOrders`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }

  async getGroupedByVendor(req: OrdersGroupByVendorReq): Promise<Array<OrdersGroupByVendorRes>> {
    var result: Array<OrdersGroupByVendorRes> = [];
    try {
      var postData: ActionReq<OrdersGroupByVendorReq> = new ActionReq<OrdersGroupByVendorReq>();
      postData.item = req;
      var resp = await axios.post<ActionRes<Array<OrdersGroupByVendorRes>>>(
        `${this.getBaseUrl()}/api/Orders/GetGroupedByVendor`,
        postData
      );
      if (resp.data.item) result = resp.data.item;
    } catch (error) {
      throw error;
    }
    return result;
  }
}
