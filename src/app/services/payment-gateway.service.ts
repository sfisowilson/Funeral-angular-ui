import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { unwrap } from '../core/services/response-unwrapper';
import { Payment_gatewayServiceProxy, InitiatePaymentRequest, PaymentInitiationResultDto, PaymentVerificationResultDto } from '../core/services/service-proxies';

// Re-export DTOs for backward compatibility
export { InitiatePaymentRequest as PaymentInitiationRequest, PaymentInitiationResultDto as PaymentInitiationResult, PaymentVerificationResultDto as PaymentVerificationResult } from '../core/services/service-proxies';

@Injectable({
    providedIn: 'root'
})
export class PaymentGatewayService {
    constructor(private proxy: Payment_gatewayServiceProxy) {}

    initiatePayment(request: InitiatePaymentRequest): Observable<PaymentInitiationResultDto> {
        return this.proxy.initiate(request).pipe(unwrap<PaymentInitiationResultDto>());
    }

    verifyPayment(transactionId: string, provider: string): Observable<PaymentVerificationResultDto> {
        return this.proxy.verify(transactionId, provider).pipe(unwrap<PaymentVerificationResultDto>());
    }

    redirectToPayment(paymentUrl: string): void {
        window.location.href = paymentUrl;
    }
}
