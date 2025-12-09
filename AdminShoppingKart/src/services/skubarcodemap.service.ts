import {axios} from '../utils/axiosinterceptor.util';
import {environment} from '../utils/environment';
import {
  SkuBarcodeMap,
  SkuBarcodeMapSearchByBarcodeReq,
} from '../models/skubarcodemap.model';

export class SkuBarcodeMapService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = environment.baseurl;
  }

  async searchByBarcode(barcode: string): Promise<SkuBarcodeMap[]> {
    const response = await axios.post(`${this.baseUrl}/api/SkuBarcodeMap/SearchByBarcode`, {barcode});
    return response.data;
  }
}
