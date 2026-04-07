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

    private readonly ALLOWED_PAYMENT_HOSTNAMES = [
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'checkout.paygate.co.za',
        'secure.peachpayments.com'
    ];

    redirectToPayment(paymentUrl: string): void {
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(paymentUrl);
        } catch {
            console.error('Payment redirect blocked: invalid URL');
            return;
        }
        if (parsedUrl.protocol !== 'https:') {
            console.error('Payment redirect blocked: non-HTTPS URL');
            return;
        }
        if (!this.ALLOWED_PAYMENT_HOSTNAMES.includes(parsedUrl.hostname)) {
            console.error('Payment redirect blocked: untrusted hostname', parsedUrl.hostname);
            return;
        }
        window.location.href = paymentUrl;
    }
}
