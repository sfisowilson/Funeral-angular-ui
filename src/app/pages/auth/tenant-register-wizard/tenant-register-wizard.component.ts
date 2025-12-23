import { Component, OnInit, signal, Injector , NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
    AuthServiceProxy,
    TenantCreateUpdateDto,
    SubscriptionPlanServiceProxy,
    PaymentServiceProxy,
    CouponServiceProxy,
    TenantType
} from '../../../core/services/service-proxies';
import { TenantBaseComponent } from '../../../core/tenant-base.component';

interface Alert {
    type: string;
    message: string;
}

@Component({
    selector: 'app-tenant-register-wizard',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule
    ],
    providers: [
        AuthServiceProxy,
        SubscriptionPlanServiceProxy,
        PaymentServiceProxy,
        CouponServiceProxy
    ],
    schemas: [NO_ERRORS_SCHEMA], templateUrl: './tenant-register-wizard.component.html',
    styleUrls: ['./tenant-register-wizard.component.scss']
})
export class TenantRegisterWizardComponent extends TenantBaseComponent implements OnInit {
    Math = Math;
    alerts: Alert[] = [];
    // Wizard state
    activeIndex = signal<number>(0);
    wizardLoading = signal<boolean>(false);
    
    // Forms
    accountForm!: FormGroup;
    
    // Available plans
    plans = signal<any[]>([]);
    selectedPlan = signal<any | null>(null);
    
    // Coupon
    couponCode = signal<string>('');
    couponValidation = signal<any | null>(null);
    couponLoading = signal<boolean>(false);
    
    // Tenant types
    tenantTypes: { label: string; value: number }[] = [
        { label: 'Funeral Parlour', value: 0 },
        { label: 'Burial Society', value: 1 },
        { label: 'Static Website', value: 3 },
        { label: 'Other', value: 2 }
    ];
    
    // Wizard steps
    wizardSteps = ['Account Information', 'Select Plan', 'Payment'];
    
    // Payment session
    paymentSessionUrl = signal<string | null>(null);
    createdTenantId = signal<string | null>(null);
    // Billing cycle: 0 = Monthly, 1 = Yearly
    billingCycle = 0;

    // Confirmation modal
    showConfirmModal = false;
    confirmMessage = '';
    confirmAction: (() => void) | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthServiceProxy,
        private planService: SubscriptionPlanServiceProxy,
        private paymentService: PaymentServiceProxy,
        private couponService: CouponServiceProxy,
        protected override injector: Injector
    ) {
        super(injector);
    }

    override async ngOnInit(): Promise<void> {
        await super.ngOnInit();
        this.initializeForms();
        this.loadPlans();
        this.checkForIncompleteRegistration();
    }

    initializeForms(): void {
        this.accountForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
            domain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
            address: ['', Validators.required],
            phone1: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
            phone2: [''],
            registrationNumber: ['', Validators.required],
            tenantType: [0, Validators.required],
            agreeToTerms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });
    }

    checkForIncompleteRegistration(): void {
        // Check localStorage for incomplete registration data
        const savedRegistration = localStorage.getItem('incompleteRegistration');
        if (savedRegistration) {
            try {
                const data = JSON.parse(savedRegistration);
                if (data.tenantId && data.timestamp) {
                    // Check if saved within last 24 hours
                    const hoursSinceCreation = (Date.now() - data.timestamp) / (1000 * 60 * 60);
                    if (hoursSinceCreation < 24) {
                        this.showAlert('You have an incomplete registration. You can resume the payment process.', 'info');
                        this.createdTenantId.set(data.tenantId);
                        this.activeIndex.set(2); // Go to payment step
                    } else {
                        localStorage.removeItem('incompleteRegistration');
                    }
                }
            } catch (e) {
                localStorage.removeItem('incompleteRegistration');
            }
        }
    }

    showAlert(message: string, type: string = 'info'): void {
        this.alerts.push({ type, message });
        setTimeout(() => this.dismissAlert(this.alerts[0]), 5000);
    }

    dismissAlert(alert: Alert): void {
        const index = this.alerts.indexOf(alert);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }

    showConfirm(message: string, action: () => void): void {
        this.confirmMessage = message;
        this.confirmAction = action;
        this.showConfirmModal = true;
    }

    executeConfirm(): void {
        if (this.confirmAction) {
            this.confirmAction();
        }
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    cancelConfirm(): void {
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async loadPlans(): Promise<void> {
        try {
            this.wizardLoading.set(true);
            const plans = await this.planService.subscriptionPlan_GetAll().toPromise();
            this.plans.set(plans || []);
        } catch (error: any) {
            this.showAlert('Failed to load subscription plans', 'danger');
        } finally {
            this.wizardLoading.set(false);
        }
    }

    async validateCoupon(): Promise<void> {
        const plan = this.selectedPlan();
        if (!this.couponCode() || !plan) return;

        try {
            this.couponLoading.set(true);
            
            // Calculate amount based on selected billing cycle
            const amount = this.billingCycle === 1 
                ? (plan.yearlyPrice || plan.monthlyPrice * 12) 
                : plan.monthlyPrice;
            
            console.log('Validating coupon:', {
                code: this.couponCode(),
                planId: plan.id,
                amount: amount,
                billingCycle: this.billingCycle
            });
            
            const validation = await this.couponService.coupon_Validate({
                couponCode: this.couponCode(),
                code: this.couponCode(),
                subscriptionPlanId: plan.id,
                amount: amount,
                planAmount: amount
            } as any).toPromise();
            
            console.log('Coupon validation result:', validation);
            this.couponValidation.set(validation);
            
            if (validation?.isValid) {
                this.showAlert(validation.message || 'Coupon applied successfully! ' + (validation.discountAmount ? `New price: R${validation.discountAmount}` : ''), 'success');
            } else {
                this.showAlert(validation?.message || 'Coupon is not valid', 'danger');
            }
        } catch (error: any) {
            console.error('Coupon validation error:', error);
            this.showAlert('Failed to validate coupon', 'danger');
        } finally {
            this.couponLoading.set(false);
        }
    }

    selectPlan(plan: any): void {
        this.selectedPlan.set(plan);
        this.couponValidation.set(null); // Reset coupon when plan changes
    }

    async nextStep(): Promise<void> {
        const currentStep = this.activeIndex();
        
        // If resuming registration and on payment step, prepare payment data
        if (currentStep === 2 && this.createdTenantId()) {
            const savedData = localStorage.getItem('incompleteRegistration');
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    // Restore saved plan and billing cycle
                    if (data.planId) {
                        const plan = this.plans().find(p => p.id === data.planId);
                        if (plan) this.selectedPlan.set(plan);
                    }
                    if (data.billingCycle !== undefined) {
                        this.billingCycle = data.billingCycle;
                    }
                } catch (e) {
                    console.error('Error loading saved registration data:', e);
                }
            }
            return;
        }
        
        // Validate current step
        if (currentStep === 0) {
            if (!this.accountForm.valid) {
                Object.keys(this.accountForm.controls).forEach(key => {
                    this.accountForm.get(key)?.markAsTouched();
                });
                this.showAlert('Please fill in all required fields correctly', 'warning');
                return;
            }
            // Move to plan selection
            this.activeIndex.set(1);
        } else if (currentStep === 1) {
            if (!this.selectedPlan()) {
                this.showAlert('Please select a subscription plan', 'warning');
                return;
            }
            // Create tenant account and initiate payment
            await this.createTenantAndInitiatePayment();
        }
    }

    previousStep(): void {
        const currentStep = this.activeIndex();
        if (currentStep > 0) {
            this.activeIndex.set(currentStep - 1);
        }
    }

    async createTenantAndInitiatePayment(): Promise<void> {
        try {
            this.wizardLoading.set(true);
            
            const formValue = this.accountForm.value;
            const selectedPlan = this.selectedPlan();
            
            
            // Create tenant DTO
            const tenantDto: TenantCreateUpdateDto = TenantCreateUpdateDto.fromJS({
                id: '00000000-0000-0000-0000-000000000000',
                name: formValue.name,
                email: formValue.email,
                password: formValue.password,
                domain: formValue.domain,
                address: formValue.address,
                phone1: formValue.phone1,
                phone2: formValue.phone2,
                registrationNumber: formValue.registrationNumber,
                tenantType: formValue.tenantType,
                subscriptionPlanId: selectedPlan?.id,
                isStaticSite: formValue.tenantType == 3
            });
            
            // Register tenant
            const authResult = await this.authService.auth_RegisterTenant(tenantDto).toPromise();
            
            if (!authResult || !authResult.succeeded || !authResult.tenantId) {
                throw new Error(authResult?.message || 'Failed to create tenant account');
            }
            
            this.createdTenantId.set(authResult.tenantId);
            
            // Save incomplete registration to localStorage
            localStorage.setItem('incompleteRegistration', JSON.stringify({
                tenantId: authResult.tenantId,
                timestamp: Date.now(),
                planId: selectedPlan?.id,
                billingCycle: this.billingCycle
            }));
            
            // Create payment session
            const couponValidation = this.couponValidation();
            const hasCoupon = couponValidation?.isValid && this.couponCode();
            
            console.log('Payment creation - Coupon info:', {
                couponCode: this.couponCode(),
                isValid: couponValidation?.isValid,
                hasCoupon: hasCoupon,
                discountedAmount: couponValidation?.discountedAmount
            });
            
            const paymentDto: any = {
                tenantId: authResult.tenantId,
                subscriptionPlanId: selectedPlan?.id,
                firstName: formValue.name,
                lastName: '',
                email: formValue.email,
                tenantEmail: formValue.email,
                tenantName: formValue.name,
                amount: this.getFinalPrice(),
                currency: 'ZAR',
                description: `${selectedPlan?.name} Subscription`,
                returnUrl: `${window.location.origin}/payment-success`,
                cancelUrl: `${window.location.origin}/payment-cancelled`,
                notifyUrl: `${window.location.origin}/api/Webhook/Webhook_PayFast`,
                isRecurring: true,
                billingCycle: this.billingCycle // 0 = Monthly, 1 = Yearly - backend converts to PayFast frequency
            };
            
            // Only add couponCode if it's valid and present
            if (hasCoupon) {
                paymentDto.couponCode = this.couponCode();
                console.log('Adding coupon code to payment:', paymentDto.couponCode);
            }
            
            console.log('Final payment DTO:', paymentDto);

            const paymentSession = await this.paymentService.payment_CreateSession(paymentDto as any).toPromise();
            
            if (paymentSession?.paymentUrl && paymentSession?.paymentData) {
                // Create a form and submit it to PayFast with the payment data
                this.submitPaymentForm(paymentSession.paymentUrl, paymentSession.paymentData);
            } else {
                throw new Error('Failed to create payment session');
            }
            
        } catch (error: any) {
            this.showAlert(error.message || 'Failed to complete registration', 'danger');
            this.wizardLoading.set(false);
        }
    }

    getFinalPrice(): number {
        const plan = this.selectedPlan();
        const validation = this.couponValidation();
        
        if (!plan) return 0;
        
        // Get base price based on billing cycle
        const basePrice = this.billingCycle === 1 
            ? (plan.yearlyPrice || plan.monthlyPrice * 12) 
            : plan.monthlyPrice;
        
        // If coupon is valid, return discounted amount
        if (validation?.isValid && validation?.discountedAmount !== undefined) {
            return validation.discountedAmount;
        }
        
        return basePrice || 0;
    }

    getDiscountAmount(): number {
        const plan = this.selectedPlan();
        const validation = this.couponValidation();
        
        if (!plan || !validation?.isValid) return 0;
        
        // Get base price based on billing cycle
        const basePrice = this.billingCycle === 1 
            ? (plan.yearlyPrice || plan.monthlyPrice * 12) 
            : plan.monthlyPrice;
        
        // Calculate discount
        const discountedPrice = validation.discountedAmount || 0;
        return Math.max(0, basePrice - discountedPrice);
    }

    onBillingCycleChange(): void {
        // Re-validate coupon when billing cycle changes to prevent coupon hacking
        if (this.couponCode() && this.couponValidation()?.isValid) {
            this.validateCoupon();
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.accountForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.accountForm.get(fieldName);
        if (!field || !field.errors) return '';
        
        if (field.errors['required']) return 'This field is required';
        if (field.errors['email']) return 'Invalid email address';
        if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
        if (field.errors['pattern']) return 'Invalid format';
        if (field.errors['passwordMismatch']) return 'Passwords do not match';
        
        return 'Invalid value';
    }

    private submitPaymentForm(url: string, paymentData: { [key: string]: string }): void {
        // Clear incomplete registration from localStorage since we're proceeding to payment
        // It will be cleared permanently on successful payment callback
        localStorage.removeItem('incompleteRegistration');
        
        // Create a temporary form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;

        // Add all payment data as hidden inputs
        for (const key in paymentData) {
            if (paymentData.hasOwnProperty(key)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = paymentData[key];
                form.appendChild(input);
            }
        }

        // Submit the form
        document.body.appendChild(form);
        form.submit();
    }
}
