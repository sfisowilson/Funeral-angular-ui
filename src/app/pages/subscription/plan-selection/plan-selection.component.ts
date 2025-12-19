import { Component, OnInit, signal , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    SubscriptionPlanServiceProxy,
    SubscriptionPlanDto,
    CouponServiceProxy,
    CouponValidationResult,
    PaymentServiceProxy,
    CreatePaymentSessionDto,
    PaymentSessionDto
} from '../../../core/services/service-proxies';

@Component({
    selector: 'app-plan-selection',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    providers: [
        SubscriptionPlanServiceProxy,
        CouponServiceProxy,
        PaymentServiceProxy
    ],
    schemas: [NO_ERRORS_SCHEMA], templateUrl: './plan-selection.component.html',
    styleUrls: ['./plan-selection.component.scss']
})
export class PlanSelectionComponent implements OnInit {
    plans = signal<SubscriptionPlanDto[]>([]);
    selectedPlan: SubscriptionPlanDto | null = null;
    couponCode: string = '';
    validatingCoupon: boolean = false;
    couponValidation: CouponValidationResult | null = null;
    processingPayment: boolean = false;
    loading = signal<boolean>(true);

    // Tenant information for payment
    tenantEmail: string = '';
    tenantName: string = '';
    firstName: string = '';
    lastName: string = '';
    // Billing cycle: 0 = Monthly, 1 = Yearly
    billingCycle: number = 0;

    // Alert system
    alerts: Alert[] = [];
    Math = Math;

    constructor(
        private planService: SubscriptionPlanServiceProxy,
        private couponService: CouponServiceProxy,
        private paymentService: PaymentServiceProxy,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadPlans();
    }

    loadPlans(): void {
        this.loading.set(true);
        this.planService.subscriptionPlan_GetAll().subscribe({
            next: (plans: any) => {
                this.plans.set(plans);
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading plans:', error);
                this.showAlert('Failed to load subscription plans', 'danger');
                this.loading.set(false);
            }
        });
    }

    selectPlan(plan: SubscriptionPlanDto): void {
        this.selectedPlan = plan;
        this.couponValidation = null;
        this.couponCode = '';
    }

    validateCoupon(): void {
        if (!this.couponCode || !this.selectedPlan) {
            return;
        }

        this.validatingCoupon = true;
        const validateDto = {
            couponCode: this.couponCode,
            code: this.couponCode,
            tenantId: '00000000-0000-0000-0000-000000000000', // Will be set by backend
            subscriptionPlanId: this.selectedPlan.id!,
            amount: this.selectedPlan.monthlyPrice!,
            planAmount: this.selectedPlan.monthlyPrice!
        };

        this.couponService.coupon_Validate(validateDto as any).subscribe({
            next: (result) => {
                this.couponValidation = result;
                if (result.isValid) {
                    this.showAlert(result.message || 'Coupon applied successfully', 'success');
                } else {
                    this.showAlert(result.message || 'This coupon cannot be applied', 'warning');
                }
                this.validatingCoupon = false;
            },
            error: (error) => {
                console.error('Error validating coupon:', error);
                this.showAlert('Failed to validate coupon', 'danger');
                this.validatingCoupon = false;
            }
        });
    }

    removeCoupon(): void {
        this.couponCode = '';
        this.couponValidation = null;
    }

    getFinalAmount(): number {
        if (!this.selectedPlan) {
            return 0;
        }
        if (this.couponValidation?.isValid) {
            return this.couponValidation.finalAmount || this.selectedPlan.monthlyPrice!;
        }
        return this.selectedPlan.monthlyPrice!;
    }

    getDiscount(): number {
        if (this.couponValidation?.isValid) {
            return this.couponValidation.discountAmount || 0;
        }
        return 0;
    }

    proceedToPayment(): void {
        if (!this.selectedPlan || !this.firstName || !this.lastName || !this.tenantEmail || !this.tenantName) {
            this.showAlert('Please fill in all required fields', 'warning');
            return;
        }

        this.processingPayment = true;

        const paymentDto = {
            tenantId: '00000000-0000-0000-0000-000000000000', // Will be created by backend
            subscriptionPlanId: this.selectedPlan.id!,
            couponCode: this.couponValidation?.isValid ? this.couponCode : undefined,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.tenantEmail,
            tenantEmail: this.tenantEmail,
            tenantName: this.tenantName,
            amount: this.getFinalAmount(),
            currency: 'ZAR',
            description: `${this.selectedPlan.name} Subscription`,
            returnUrl: `${window.location.origin}/subscription/payment-success`,
            cancelUrl: `${window.location.origin}/subscription/payment-cancelled`,
            notifyUrl: `${window.location.origin}/api/Webhook/Webhook_PayFast`,
            isRecurring: true
        } as any;

        // attach billing cycle (0 monthly, 1 yearly)
        (paymentDto as any).billingCycle = this.billingCycle;

        this.paymentService.payment_CreateSession(paymentDto as any).subscribe({
            next: (session: PaymentSessionDto) => {
                // Redirect to PayFast
                if (session.paymentUrl) {
                    window.location.href = session.paymentUrl;
                } else {
                    this.showAlert('Payment URL not available', 'danger');
                    this.processingPayment = false;
                }
            },
            error: (error) => {
                console.error('Error creating payment session:', error);
                this.showAlert('Failed to initiate payment. Please try again.', 'danger');
                this.processingPayment = false;
            }
        });
    }

    showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
        const alert: Alert = { message, type, id: Date.now() };
        this.alerts.push(alert);
        setTimeout(() => this.dismissAlert(alert), 5000);
    }

    dismissAlert(alert: Alert): void {
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
    }
}

interface Alert {
    message: string;
    type: 'success' | 'danger' | 'warning' | 'info';
    id: number;
}
