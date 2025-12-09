// SKU Barcode Map Service Interfaces
export interface SkuBarcodeMap {
  skuid: number;
  barcode: string;
}

export interface SkuBarcodeMapSearchByBarcodeReq {
  barcode: string;
}

