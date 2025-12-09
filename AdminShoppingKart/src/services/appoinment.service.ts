import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  AddStaffReq,
  Appoinment,
  AppoinmentDeleteReq,
  AppoinmentFinal,
  AppoinmentSelectReq,
  BookedAppoinmentRes,
  UpdatePaymentReq,
  UpdateStatusReq,
} from '../models/appoinment.model';
import {
  AppointmentSummary,
  AppointmentSummarySelectReq,
} from '../models/appointmentsummary.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class AppoinmentService {
  private baseUrl: string;
  private http: AxiosHelperUtils;

  constructor() {
    this.baseUrl = environment.baseurl + '/api/Appoinment';
    this.http = new AxiosHelperUtils();
  }

  async select(req: AppoinmentSelectReq) {
    const postdata: ActionReq<AppoinmentSelectReq> =
      new ActionReq<AppoinmentSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Array<Appoinment>>>(
      this.baseUrl + '/select',
      postdata,
    );
    return resp.item;
  }

  async save(req: Appoinment) {
    const postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Appoinment>>(
      this.baseUrl + '/save',
      postdata,
    );
    return resp.item;
  }

  async insert(req: Appoinment) {
    const postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Appoinment>>(
      this.baseUrl + '/insert',
      postdata,
    );
    return resp.item;
  }

  async update(req: Appoinment) {
    const postdata: ActionReq<Appoinment> = new ActionReq<Appoinment>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Appoinment>>(
      this.baseUrl + '/update',
      postdata,
    );
    return resp.item;
  }

  async delete(req: AppoinmentDeleteReq) {
    const postdata: ActionReq<AppoinmentDeleteReq> =
      new ActionReq<AppoinmentDeleteReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      this.baseUrl + '/delete',
      postdata,
    );
    return resp.item;
  }

  async SelectBookedAppoinment(req: AppoinmentSelectReq) {
    const postdata: ActionReq<AppoinmentSelectReq> =
      new ActionReq<AppoinmentSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<Array<BookedAppoinmentRes>>>(
      this.baseUrl + '/SelectBookedAppoinment',
      postdata,
    );
    return resp.item;
  }

  async Assignstaff(req: AddStaffReq) {
    const postdata: ActionReq<AddStaffReq> = new ActionReq<AddStaffReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      this.baseUrl + '/Assignstaff',
      postdata,
    );
    return resp.item;
  }

  async UpdateStatus(req: UpdateStatusReq) {
    const postdata: ActionReq<UpdateStatusReq> = new ActionReq<UpdateStatusReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      this.baseUrl + '/UpdateStatus',
      postdata,
    );
    return resp.item;
  }

  async UpdatePayment(req: UpdatePaymentReq) {
    const postdata: ActionReq<UpdatePaymentReq> =
      new ActionReq<UpdatePaymentReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<boolean>>(
      this.baseUrl + '/UpdatePayment',
      postdata,
    );
    return resp.item;
  }

  async GetAppointmentSummary(req: AppointmentSummarySelectReq) {
    const postdata: ActionReq<AppointmentSummarySelectReq> =
      new ActionReq<AppointmentSummarySelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<AppointmentSummary>>(
      this.baseUrl + '/GetAppointmentSummary',
      postdata,
    );
    return resp.item;
  }
}

