import { Component, OnInit , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    PaymentServiceProxy,
    InvoiceServiceProxy,
    TenantSubscriptionServiceProxy
} from '../../../core/services/service-proxies';

@Component({
    selector: 'app-payment-callback',
    standalone: true,
    imports: [
        CommonModule
    ],
    providers: [
        PaymentServiceProxy,
        InvoiceServiceProxy,
        TenantSubscriptionServiceProxy
    ],
    schemas: [NO_ERRORS_SCHEMA], templateUrl: './payment-callback.component.html',
    styleUrls: ['./payment-callback.component.scss']
})
export class PaymentCallbackComponent implements OnInit {
    loading: boolean = true;
    paymentSuccess: boolean = false;
    paymentId: string | null = null;
    invoiceId: string | null = null;
    subscriptionId: string | null = null;
    errorMessage: string = '';
    redirectCountdown: number = 5;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private paymentService: PaymentServiceProxy,
        private invoiceService: InvoiceServiceProxy,
        private subscriptionService: TenantSubscriptionServiceProxy
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.paymentId = params['paymentId'] || params['payment_id'];
            
            if (this.paymentId) {
                this.checkPaymentStatus();
            } else {
                this.loading = false;
                this.paymentSuccess = false;
                this.errorMessage = 'No payment reference found';
            }
        });
    }

    checkPaymentStatus(): void {
        if (!this.paymentId) {
            return;
        }

        this.paymentService.payment_GetStatus(this.paymentId).subscribe({
            next: (payment: any) => {
                this.loading = false;
                
                if (payment.status === 'Success' || payment.status === 'Completed') {
                    this.paymentSuccess = true;
                    this.loadSubscriptionDetails();
                    this.startRedirectCountdown();
                } else if (payment.status === 'Failed' || payment.status === 'Cancelled') {
                    this.paymentSuccess = false;
                    this.errorMessage = 'Payment was not successful. Please try again.';
                } else {
                    this.paymentSuccess = false;
                    this.errorMessage = 'Payment is still being processed. Please check back later.';
                }
            },
            error: (error) => {
                console.error('Error checking payment status:', error);
                this.loading = false;
                this.paymentSuccess = false;
                this.errorMessage = 'Unable to verify payment status. Please contact support.';
            }
        });
    }

    loadSubscriptionDetails(): void {
        this.subscriptionService.tenantSubscription_GetActive().subscribe({
            next: (subscription) => {
                this.subscriptionId = subscription.id;
            },
            error: (error) => {
                console.error('Error loading subscription:', error);
            }
        });
    }

    startRedirectCountdown(): void {
        const interval = setInterval(() => {
            this.redirectCountdown--;
            if (this.redirectCountdown <= 0) {
                clearInterval(interval);
                this.router.navigate(['/dashboard']);
            }
        }, 1000);
    }

    downloadInvoice(): void {
        if (this.invoiceId) {
            this.invoiceService.invoice_Download(this.invoiceId).subscribe({
                next: (blob: any) => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `invoice-${this.invoiceId}.pdf`;
                    link.click();
                    window.URL.revokeObjectURL(url);
                },
                error: (error: any) => {
                    console.error('Error downloading invoice:', error);
                }
            });
        }
    }

    goToDashboard(): void {
        this.router.navigate(['/dashboard']);
    }

    tryAgain(): void {
        this.router.navigate(['/subscription/plans']);
    }
}
