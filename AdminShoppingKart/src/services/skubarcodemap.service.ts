import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {
  SkuBarcodeMap,
  SkuBarcodeMapSearchByBarcodeReq,
} from '../models/skubarcodemap.model';

export class SkuBarcodeMapService {
  // Get base URL directly from Redux store
  private getBaseUrl(): string {
    const store = require('../redux/store.redux').store;
    const state = store.getState();
    return state?.environment?.url || require('../utils/environment').environment.baseurl;
  }

  async searchByBarcode(barcode: string): Promise<SkuBarcodeMap[]> {
    const response = await axios.post(`${this.getBaseUrl()}/api/SkuBarcodeMap/SearchByBarcode`, {barcode});
    return response.data;
  }
}
