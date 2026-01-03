import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// NOTE: Generated proxy Tenant_bankingServiceProxy exists but has incomplete methods
// Consider regenerating proxies with complete API endpoints

export interface TenantBankingDetail {
  id?: string;
  tenantId?: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  branchCode?: string;
  branchName?: string;
  accountHolderName?: string;
  debitDay?: number;
  paymentMethod?: string;
  mandateReference?: string;
  mandateSignedDate?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TenantBankingService {
  private apiUrl = `${environment.apiUrl}/tenant-banking`;

  constructor(private http: HttpClient) {}

  saveBankingDetails(details: TenantBankingDetail): Observable<TenantBankingDetail> {
    return this.http.post<TenantBankingDetail>(this.apiUrl, details);
  }

  getBankingDetails(): Observable<TenantBankingDetail> {
    return this.http.get<TenantBankingDetail>(this.apiUrl);
  }

  verifyBankingDetails(bankingDetailId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${bankingDetailId}/verify`, {});
  }

  deleteBankingDetails(bankingDetailId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${bankingDetailId}`);
  }
}
