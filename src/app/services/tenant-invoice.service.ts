import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TenantInvoice {
  id: string;
  invoiceNumber?: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  issueDate: string;
  status: string;
  isPaid: boolean;
  description?: string;
  tenantId: string;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  unpaidCount: number;
  overdueCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TenantInvoiceService {
  private apiUrl = `${environment.apiUrl}/tenant-invoice`;

  constructor(private http: HttpClient) {}

  getMyInvoices(status?: string, page: number = 1, pageSize: number = 20): Observable<TenantInvoice[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<TenantInvoice[]>(`${this.apiUrl}/my-invoices`, { params });
  }

  getInvoiceById(invoiceId: string): Observable<TenantInvoice> {
    return this.http.get<TenantInvoice>(`${this.apiUrl}/${invoiceId}`);
  }

  getUnpaidInvoices(): Observable<TenantInvoice[]> {
    return this.http.get<TenantInvoice[]>(`${this.apiUrl}/unpaid`);
  }

  getInvoiceSummary(): Observable<InvoiceSummary> {
    return this.http.get<InvoiceSummary>(`${this.apiUrl}/summary`);
  }

  getAllTenantInvoices(tenantId?: string, status?: string, page: number = 1, pageSize: number = 20): Observable<any[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (tenantId) {
      params = params.set('tenantId', tenantId);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }
}
