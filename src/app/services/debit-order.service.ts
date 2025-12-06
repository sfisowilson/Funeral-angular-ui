import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DebitOrderBatch {
  id: string;
  batchNumber: string;
  processingDate: string;
  submittedAt?: string;
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  status: string;
  batchFilePath?: string;
  responseFilePath?: string;
}

export interface DebitOrderTransaction {
  id: string;
  batchId: string;
  invoiceId: string;
  invoiceNumber?: string;
  tenantId: string;
  tenantName?: string;
  amount: number;
  accountNumber: string;
  bankName: string;
  status: string;
  failureReason?: string;
  bankReference?: string;
  processedAt?: string;
}

export interface CreateBatchRequest {
  processingDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class DebitOrderService {
  private apiUrl = `${environment.apiUrl}/debit-order`;

  constructor(private http: HttpClient) {}

  createBatch(request: CreateBatchRequest): Observable<DebitOrderBatch> {
    return this.http.post<DebitOrderBatch>(`${this.apiUrl}/batch/create`, request);
  }

  getBatches(page: number = 1, pageSize: number = 20): Observable<DebitOrderBatch[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<DebitOrderBatch[]>(`${this.apiUrl}/batch`, { params });
  }

  getBatchById(batchId: string): Observable<DebitOrderBatch> {
    return this.http.get<DebitOrderBatch>(`${this.apiUrl}/batch/${batchId}`);
  }

  getBatchTransactions(batchId: string): Observable<DebitOrderTransaction[]> {
    return this.http.get<DebitOrderTransaction[]>(`${this.apiUrl}/batch/${batchId}/transactions`);
  }

  generateNAEDOFile(batchId: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/batch/${batchId}/generate-file`, {}, {
      responseType: 'blob'
    });
  }

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
