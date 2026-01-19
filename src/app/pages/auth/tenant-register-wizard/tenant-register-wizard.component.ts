import { Component, OnInit, signal, Injector , NO_ERRORS_SCHEMA, effect, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
    AuthServiceProxy,
    TenantCreateUpdateDto,
    PlanConfigurationServiceProxy,
    PaymentServiceProxy,
    CouponServiceProxy,
    TenantType,
    TenantServiceProxy,
    TenantTypeDto
} from '../../../core/services/service-proxies';
import { TenantBaseComponent } from '../../../core/tenant-base.component';
import { ORGANIZATION_TYPES, OrganizationType, OrgTypeQuestion } from './organization-types.config';

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
        PlanConfigurationServiceProxy,
        PaymentServiceProxy,
        CouponServiceProxy,
        TenantServiceProxy
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
    
    // Modal states
    showTermsModal = false;
    showPrivacyModal = false;
    showPlanFeaturesModal = signal<boolean>(false);
    selectedPlanForFeatures = signal<any | null>(null);
    
    // Forms
    accountForm!: FormGroup;
    organizationQuestionsForm!: FormGroup;
    
    // Organization types
    allOrganizationTypes = ORGANIZATION_TYPES;
    selectedOrganizationType = signal<OrganizationType | null>(null);
    orgTypeQuestions = signal<OrgTypeQuestion[]>([]);
    
    // Available plans
    plans = signal<any[]>([]);
    selectedPlan = signal<any | null>(null);
    
    // Real-time pricing
    basePlanPrice = signal<number>(0);
    calculatedPrice = signal<{
        monthly: number;
        yearly: number;
        yearlyDiscount: number;
    }>({ monthly: 0, yearly: 0, yearlyDiscount: 15 });
    priceBreakdown = signal<{
        basePrice: number;
        organizationModifier: number;
        volumeModifiers: { label: string; impact: string }[];
        couponDiscount: number;
    }>({ basePrice: 0, organizationModifier: 1, volumeModifiers: [], couponDiscount: 0 });
    selectedBillingCycle = signal<'monthly' | 'yearly'>('monthly');
    
    // Coupon
    couponCode = signal<string>('');
    couponValidation = signal<any | null>(null);
    couponLoading = signal<boolean>(false);
    couponFromUrl = signal<boolean>(false); // Track if coupon came from URL
    
    // Tenant types (loaded dynamically from API)
    tenantTypes = signal<TenantTypeDto[]>([]);
    
    // Wizard steps - Plan selection is now first (step 0)
    wizardSteps = ['Select Plan', 'Account Information', 'Payment'];
    
    // Payment session
    paymentSessionUrl = signal<string | null>(null);
    createdTenantId = signal<string | null>(null);
    paymentTriggered = signal<boolean>(false); // Track if payment has been triggered
    // Billing cycle: 0 = Monthly, 1 = Yearly
    billingCycle = 0;
    
    // Pro-rata billing
    enableProRata = signal<boolean>(false);
    proRataInfo = signal<{
        daysInPeriod: number;
        daysRemaining: number;
        proRatedAmount: number;
        fullAmount: number;
    } | null>(null);

    // Confirmation modal
    showConfirmModal = false;
    confirmMessage = '';
    confirmAction: (() => void) | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private authService: AuthServiceProxy,
        private planConfigService: PlanConfigurationServiceProxy,
        private paymentService: PaymentServiceProxy,
        private couponService: CouponServiceProxy,
        private tenantProxy: TenantServiceProxy,
        protected override injector: Injector
    ) {
        super(injector);
    }

    override async ngOnInit(): Promise<void> {
        await super.ngOnInit();
        this.initializeForms();
        await this.loadTenantTypes();
        await this.loadPlans(undefined); // Load all plans initially
        await this.loadProRataSetting(); // Load system pro-rata setting
        this.checkForIncompleteRegistration(); // Call after plans are loaded
        
        // Check for coupon in URL query parameters
        this.activatedRoute.queryParams.subscribe(params => {
            if (params['coupon']) {
                this.applyCouponFromUrl(params['coupon']);
            }
        });

        // Auto-trigger payment when reaching step 2
        runInInjectionContext(this.injector, () => {
            effect(() => {
                const currentStep = this.activeIndex();
                if (currentStep === 2 && !this.paymentTriggered() && !this.wizardLoading()) {
                    this.paymentTriggered.set(true);
                    // Delay to ensure UI updates first
                    setTimeout(() => {
                        this.createTenantAndInitiatePayment().catch(error => {
                            console.error('Payment creation error:', error);
                            this.paymentTriggered.set(false); // Reset flag on error
                        });
                    }, 300);
                }
            });
        });
    }

    /**
     * Apply coupon code from URL query parameter
     * @param couponCode The coupon code from the URL
     */
    private async applyCouponFromUrl(couponCode: string): Promise<void> {
        // Convert to uppercase to match standard coupon format
        const normalizedCode = couponCode.toUpperCase();
        this.couponCode.set(normalizedCode);
        this.couponFromUrl.set(true);
        
        // Automatically validate the coupon
        await this.validateCoupon();
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
            agreeToTerms: [false, Validators.requiredTrue]
        }, { validators: this.passwordMatchValidator });
        
        // Initialize empty organization questions form
        this.organizationQuestionsForm = this.fb.group({});
    }
    
    onOrganizationTypeSelected(orgType: OrganizationType): void {
        this.selectedOrganizationType.set(orgType);
        this.orgTypeQuestions.set(orgType.questions);
        this.accountForm.patchValue({ tenantType: orgType.value });
        
        // Load plans for selected tenant type
        this.loadPlans(orgType.value);
        
        // Rebuild organization questions form with dynamic controls
        this.organizationQuestionsForm = this.fb.group({});
        orgType.questions.forEach(question => {
            const validators = question.required ? [Validators.required] : [];
            let defaultValue: any = '';
            
            if (question.type === 'checkbox') {
                defaultValue = [];
            } else if (question.type === 'number') {
                defaultValue = null;
            } else if (question.type === 'radio') {
                defaultValue = null;
            }
            
            this.organizationQuestionsForm.addControl(
                question.id,
                this.fb.control(defaultValue, validators)
            );
        });
        
        // Listen for changes to recalculate pricing
        this.organizationQuestionsForm.valueChanges.subscribe(() => {
            this.calculateDynamicPricing();
        });
    }
    
    calculateProRataInfo(): void {
        if (!this.enableProRata()) {
            this.proRataInfo.set(null);
            return;
        }
        
        const now = new Date();
        const plan = this.selectedPlan();
        if (!plan) {
            this.proRataInfo.set(null);
            return;
        }
        
        let daysInPeriod: number;
        let daysRemaining: number;
        let fullAmount: number;
        
        if (this.billingCycle === 1) { // Yearly
            const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            daysInPeriod = this.isLeapYear(now.getFullYear()) ? 366 : 365;
            daysRemaining = Math.ceil((lastDayOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            fullAmount = plan.yearlyPrice || (plan.monthlyPrice * 12);
        } else { // Monthly
            const year = now.getFullYear();
            const month = now.getMonth();
            daysInPeriod = new Date(year, month + 1, 0).getDate();
            const lastDayOfMonth = new Date(year, month, daysInPeriod, 23, 59, 59);
            daysRemaining = Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            fullAmount = plan.monthlyPrice;
        }
        
        const proRatedAmount = Math.max(5, Math.round((fullAmount / daysInPeriod) * daysRemaining * 100) / 100);
        
        this.proRataInfo.set({
            daysInPeriod,
            daysRemaining,
            proRatedAmount,
            fullAmount
        });
    }
    
    async loadProRataSetting(): Promise<void> {
        try {
            const enabled = await this.planConfigService.planConfiguration_GetProRataSetting().toPromise();
            this.enableProRata.set(enabled?.result || false);
            if (enabled) {
                this.calculateProRataInfo();
            }
        } catch (error: any) {
            console.error('Failed to load pro-rata setting:', error);
            this.enableProRata.set(false);
        }
    }
    
    isLeapYear(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
    
    calculateDynamicPricing(): void {
        const plan = this.selectedPlan();
        const orgType = this.selectedOrganizationType();
        
        if (!plan) {
            this.calculatedPrice.set({ monthly: 0, yearly: 0, yearlyDiscount: 15 });
            this.priceBreakdown.set({ 
                basePrice: 0, 
                organizationModifier: 1, 
                volumeModifiers: [], 
                couponDiscount: 0 
            });
            return;
        }
        
        // Recalculate pro-rata info when pricing changes
        this.calculateProRataInfo();
        
        // Use plan configuration prices directly (no modifiers for plan configs)
        // IMPORTANT: Keep these as BASE prices, without pro-rata adjustment
        const monthlyPrice = plan.monthlyPrice || 0;
        const yearlyPrice = plan.yearlyPrice || (monthlyPrice * 12 * 0.85); // 15% discount if not set
        const yearlyDiscount = plan.yearlyPrice ? 
            Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100) : 15;
        
        // Apply coupon discount if valid (to BASE prices only, pro-rata is applied in getFinalPrice)
        let couponDiscountAmount = 0;
        let finalMonthly = monthlyPrice;
        let finalYearly = yearlyPrice;
        
        const couponValidation = this.couponValidation();
        if (couponValidation?.isValid) {
            // The coupon gives us a discount amount for the current billing cycle
            // Calculate based on what was validated against
            const discountAmount = couponValidation.discountAmount || 0;
            
            // If the coupon was validated for a specific cycle, apply the discount proportionally
            if (this.billingCycle === 1) {
                // Coupon was for yearly - discount applies to yearly
                finalYearly = Math.max(0, yearlyPrice - discountAmount);
                // Calculate proportional discount for monthly (divide yearly discount by 12)
                const monthlyDiscount = discountAmount / 12;
                finalMonthly = Math.max(0, monthlyPrice - monthlyDiscount);
                couponDiscountAmount = discountAmount;
            } else {
                // Coupon was for monthly - discount applies to monthly
                finalMonthly = Math.max(0, monthlyPrice - discountAmount);
                // Calculate proportional discount for yearly (multiply monthly discount by 12)
                const yearlyDiscount = discountAmount * 12;
                finalYearly = Math.max(0, yearlyPrice - yearlyDiscount);
                couponDiscountAmount = discountAmount;
            }
        }
        
        // Store BASE prices (with coupon, but NOT pro-rata) for display in Billing Cycle selector
        this.calculatedPrice.set({
            monthly: finalMonthly,
            yearly: finalYearly,
            yearlyDiscount
        });
        
        // Store BASE breakdown (pro-rata is NOT applied here, only in getFinalPrice)
        this.priceBreakdown.set({
            basePrice: monthlyPrice,
            organizationModifier: 1, // No modifiers for plan configurations
            volumeModifiers: [], // No volume modifiers for plan configurations
            couponDiscount: couponDiscountAmount
        });
    }
    
    getOrganizationTypesByCategory(category: string): OrganizationType[] {
        return this.allOrganizationTypes.filter(t => t.category === category);
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
                        
                        // Restore saved plan and billing cycle
                        if (data.planId) {
                            const plan = this.plans().find(p => p.id === data.planId || p.subscriptionPlanId === data.planId);
                            if (plan) {
                                this.selectedPlan.set(plan);
                                this.calculateDynamicPricing();
                            }
                        }
                        if (data.billingCycle !== undefined) {
                            this.billingCycle = data.billingCycle;
                            this.selectedBillingCycle.set(data.billingCycle === 1 ? 'yearly' : 'monthly');
                        }
                        
                        this.activeIndex.set(3); // Go to payment step (0=Plan, 1=Account, 2=Organization, 3=Payment)
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

    async loadPlans(tenantType?: number): Promise<void> {
        try {
            this.wizardLoading.set(true);
            // Load all available plans - feature-based, not tenant-type specific
            // All tenant types can access the same feature-based plans
            const response = await this.planConfigService.planConfiguration_GetActive().toPromise();
            const plans = response?.result;
            this.plans.set(plans || []);
            
            // If coupon from URL exists and no plan is selected yet, auto-select the first plan
            if (this.couponFromUrl() && !this.selectedPlan() && plans && plans.length > 0) {
                this.selectPlan(plans[0]);
            }
        } catch (error: any) {
            this.showAlert('Failed to load subscription plans', 'danger');
        } finally {
            this.wizardLoading.set(false);
        }
    }

    async loadTenantTypes(): Promise<void> {
        try {
            const response = await this.tenantProxy.tenant_GetTenantTypes().toPromise();
            const types = response?.result;
            this.tenantTypes.set(types || []);
        } catch (error: any) {
            console.error('Failed to load tenant types:', error);
            // Fallback to default types if API call fails
            const fallbackTypes: any[] = [
                { value: 0, name: 'Basic', label: 'Funeral Parlour', description: '' },
                { value: 1, name: 'Standard', label: 'Burial Society', description: '' },
                { value: 2, name: 'Premium', label: 'Other', description: '' },
                { value: 3, name: 'Ecommerce', label: 'E-commerce Store', description: '' }
            ];
            this.tenantTypes.set(fallbackTypes as any);
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
            
            const validationResponse = await this.couponService.coupon_Validate({
                couponCode: this.couponCode(),
                code: this.couponCode(),
                subscriptionPlanId: plan.subscriptionPlanId || plan.id,
                amount: amount,
                planAmount: amount
            } as any).toPromise();
            const validation = validationResponse?.result;
            
            console.log('Coupon validation result:', validation);
            this.couponValidation.set(validation);
            
            if (validation?.isValid) {
                this.showAlert(`Coupon '${this.couponCode()}' applied! You get a discount of R${validation.discountAmount}`, 'success');
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
        
        // If there's a coupon from URL and this is the first plan selection, validate it
        if (this.couponFromUrl() && this.couponCode() && !this.couponValidation()) {
            this.validateCoupon();
        } else {
            // Otherwise reset coupon when plan changes
            this.couponValidation.set(null);
        }
        
        this.calculateProRataInfo(); // Recalculate pro-rata for new plan
        this.calculateDynamicPricing(); // Recalculate pricing with new plan
    }

    openPlanFeaturesModal(plan: any): void {
        this.selectedPlanForFeatures.set(plan);
        this.showPlanFeaturesModal.set(true);
    }

    async nextStep(): Promise<void> {
        const currentStep = this.activeIndex();
        
        // If resuming registration and on payment step, prepare payment data
        if (currentStep === 3 && this.createdTenantId()) {
            const savedData = localStorage.getItem('incompleteRegistration');
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    // Restore saved plan and billing cycle
                    if (data.planId) {
                        const plan = this.plans().find(p => p.id === data.planId || p.subscriptionPlanId === data.planId);
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
        
        // Step 0: Plan Selection (now first)
        if (currentStep === 0) {
            if (!this.selectedPlan()) {
                this.showAlert('Please select a subscription plan', 'warning');
                return;
            }
            // Move to account information
            this.activeIndex.set(1);
        }
        // Step 1: Account Information
        else if (currentStep === 1) {
            if (!this.accountForm.valid) {
                Object.keys(this.accountForm.controls).forEach(key => {
                    this.accountForm.get(key)?.markAsTouched();
                });
                this.showAlert('Please fill in all required fields correctly', 'warning');
                return;
            }
            
            // Move to payment - this will auto-trigger payment creation via effect
            this.activeIndex.set(2);
        } 
        // Step 2: Payment Processing - Auto-triggered via effect
        else if (currentStep === 2) {
            // Payment is automatically triggered by the effect watcher
            // No manual action needed here
            return;
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
                subscriptionPlanId: selectedPlan?.subscriptionPlanId || selectedPlan?.id,  // Use linked SubscriptionPlan ID
                selectedPlanConfigurationId: selectedPlan?.id, // Plan configuration ID
                couponCode: this.couponCode() || null, // Include coupon if valid
                billingCycle: this.billingCycle // 0 = Monthly, 1 = Yearly
            });
            
            // Register tenant
            const authResponse = await this.authService.auth_RegisterTenant(tenantDto).toPromise();
            const authResult = authResponse?.result;
            
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
                subscriptionPlanId: selectedPlan?.subscriptionPlanId || selectedPlan?.id,  // Use linked SubscriptionPlan ID
                firstName: formValue.name,
                lastName: '',
                email: formValue.email,
                tenantEmail: formValue.email,
                tenantName: formValue.name,
                amount: this.getFinalPrice(),
                currency: 'ZAR',
                description: `${selectedPlan?.name || selectedPlan?.planName} Subscription`,
                returnUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(formValue.email)}&subdomain=${encodeURIComponent(formValue.domain)}`,
                cancelUrl: `${window.location.origin}/payment-cancelled`,
                notifyUrl: `${window.location.origin}/api/Webhook/Webhook_PayFast`,
                isRecurring: true,
                billingCycle: this.billingCycle, // 0 = Monthly, 1 = Yearly - backend converts to PayFast frequency
                enableProRata: this.enableProRata() // Include pro-rata flag
            };
            
            // Only add couponCode if it's valid and present
            if (hasCoupon) {
                paymentDto.couponCode = this.couponCode();
                console.log('Adding coupon code to payment:', paymentDto.couponCode);
            }
            
            console.log('Final payment DTO:', paymentDto);

            const paymentSessionResponse = await this.paymentService.payment_CreateSession(paymentDto as any).toPromise();
            const paymentSession = paymentSessionResponse?.result;

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
        
        // Determine the base price for the current billing cycle
        let basePrice = this.selectedBillingCycle() === 'yearly' 
            ? (plan.yearlyPrice || plan.monthlyPrice * 12) 
            : plan.monthlyPrice;

        // Start with the base price
        let finalPrice = basePrice;

        // Apply pro-rata if enabled
        if (this.enableProRata() && this.proRataInfo()) {
            finalPrice = this.proRataInfo()!.proRatedAmount;
        }
        
        // If a coupon is valid, its validated amount is the final source of truth
        if (validation?.isValid && validation.finalAmount !== undefined) {
            finalPrice = validation.finalAmount;
        }
        
        // Ensure the final price is not less than 0
        return Math.max(0, finalPrice);
    }

    getDiscountAmount(): number {
        const validation = this.couponValidation();
        
        if (!validation?.isValid) return 0;
        
        // Return the discount amount for the current billing cycle
        const discountAmount = validation.discountAmount || 0;
        
        if (this.billingCycle === 1) {
            // Yearly billing - return full discount
            return discountAmount;
        } else {
            // Monthly billing - return monthly portion of discount
            return discountAmount;
        }
    }

    onBillingCycleChange(): void {
        // Recalculate pro-rata info when billing cycle changes
        this.calculateProRataInfo();
        
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
    
    onCheckboxChange(event: Event, questionId: string, value: any): void {
        const checkbox = event.target as HTMLInputElement;
        const currentValue = this.organizationQuestionsForm.get(questionId)?.value || [];
        
        if (checkbox.checked) {
            currentValue.push(value);
        } else {
            const index = currentValue.indexOf(value);
            if (index > -1) {
                currentValue.splice(index, 1);
            }
        }
        
        this.organizationQuestionsForm.patchValue({ [questionId]: currentValue });
    }
}
