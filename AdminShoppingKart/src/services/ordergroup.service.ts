import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  OrderGroupAdminPanelOrderSummaryV3Req,
  OrderGroupAdminPanelOrderSummaryV3Res,
} from '../models/orders.model';

export class OrderGroupService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.baseurl;
  }

  async adminPanelOrderSummaryV3(req: OrderGroupAdminPanelOrderSummaryV3Req): Promise<OrderGroupAdminPanelOrderSummaryV3Res> {
    var postData: ActionReq<OrderGroupAdminPanelOrderSummaryV3Req> = new ActionReq<OrderGroupAdminPanelOrderSummaryV3Req>();
    postData.item = req;
    var resp = await axios.post<ActionRes<OrderGroupAdminPanelOrderSummaryV3Res>>(
      `${this.baseUrl}/api/OrderGroup/AdminPanelOrderSummaryV3`,
      postData
    );
    if (resp.data.item) {
      return resp.data.item;
    }
    throw new Error('No data returned from API');
  }
}
