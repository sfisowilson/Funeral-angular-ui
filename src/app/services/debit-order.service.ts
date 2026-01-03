import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Debit_orderServiceProxy, 
  DebitOrderBatchDto,
  DebitOrderTransactionDto
} from '../core/services/service-proxies';

// Re-export DTOs for backward compatibility
export { 
  DebitOrderBatchDto as DebitOrderBatch,
  DebitOrderTransactionDto as DebitOrderTransaction
} from '../core/services/service-proxies';

export interface CreateBatchRequest {
  processingDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class DebitOrderService {
  private apiUrl = `${environment.apiUrl}/debit-order`;
  private http: HttpClient;

  constructor(
    private proxy: Debit_orderServiceProxy,
    http: HttpClient
  ) {
    this.http = http;
  }

  // NOTE: createBatch() not yet in generated proxy - using direct HTTP call
  createBatch(request: CreateBatchRequest): Observable<DebitOrderBatchDto> {
    return this.http.post<DebitOrderBatchDto>(`${this.apiUrl}/batch/create`, request);
  }

  getBatches(page: number = 1, pageSize: number = 20): Observable<DebitOrderBatchDto[]> {
    return this.proxy.batchList(page, pageSize);
  }

  getBatchById(batchId: string): Observable<DebitOrderBatchDto> {
    return this.proxy.batchById(batchId);
  }

  getBatchTransactions(batchId: string): Observable<DebitOrderTransactionDto[]> {
    return this.proxy.batchTransactions(batchId);
  }

  // NOTE: generateNAEDOFile() returns File, not available in proxy - using direct HTTP call
  generateNAEDOFile(batchId: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/batch/${batchId}/generate-file`, {}, {
      responseType: 'blob'
    });
  }

  // NOTE: processResponse() uses FormData, not available in proxy - using direct HTTP call
  processResponse(file: File): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('responseFile', file);
    
    return this.http.post<{ message: string }>(`${this.apiUrl}/batch/process-response`, formData);
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
