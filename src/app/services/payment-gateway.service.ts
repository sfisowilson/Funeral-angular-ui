import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentInitiationRequest {
  invoiceId: string;
  amount: number;
  provider: string; // 'Ozow', 'PayFast', etc.
  returnUrl: string;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  paymentStatus?: string;
  amount: number;
  paymentDate?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {
  private apiUrl = `${environment.apiUrl}/payment-gateway`;

  constructor(private http: HttpClient) {}

  initiatePayment(request: PaymentInitiationRequest): Observable<PaymentInitiationResult> {
    return this.http.post<PaymentInitiationResult>(`${this.apiUrl}/initiate`, request);
  }

  verifyPayment(transactionId: string, provider: string): Observable<PaymentVerificationResult> {
    const params = new HttpParams().set('provider', provider);
    return this.http.get<PaymentVerificationResult>(`${this.apiUrl}/verify/${transactionId}`, { params });
  }

  redirectToPayment(paymentUrl: string): void {
    window.location.href = paymentUrl;
  }
}
