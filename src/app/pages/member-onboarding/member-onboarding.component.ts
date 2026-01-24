import { Component, OnInit, Input, signal, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { 
    MemberProfileCompletionServiceProxy,
    ProfileCompletionStatusDto,
    UpdateProfileCompletionStepDto,
    PremiumCalculationServiceProxy,
    PremiumCalculationResultDto,
    PremiumCalculationSettingsDto,
    OnboardingFieldConfigurationServiceProxy,
    DocumentRequirementServiceProxy,
    UserProfileServiceProxy,
    UserProfileDto
} from '../../core/services/service-proxies';
import { environment } from '../../../environments/environment';
import { OnboardingStepType } from '../../core/services/service-proxies';
import { OnboardingStepConfiguration } from '../../core/models/onboarding-step-configuration.model';
import { PersonalInfoStepComponent } from './steps/personal-info-step.component';
import { BeneficiariesStepComponent } from './steps/beneficiaries-step.component';
import { DependentsStepComponent } from './steps/dependents-step.component';
import { BankingDetailsStepComponent } from './steps/banking-details-step.component';
import { TermsStepComponent } from './steps/terms-step.component';
import { SummaryStepComponent } from './steps/summary-step/summary-step.component';

@Component({
    selector: 'app-member-onboarding',
    standalone: true,
    imports: [
        CommonModule,
        StepsModule,
        CardModule,
        ButtonModule,
        ToastModule,
        ProgressBarModule,
        TagModule,
        DialogModule,
        TableModule,
        PersonalInfoStepComponent,
        DependentsStepComponent,
        BeneficiariesStepComponent,
        BankingDetailsStepComponent,
        TermsStepComponent,
        SummaryStepComponent
    ],
    providers: [MessageService, MemberProfileCompletionServiceProxy, PremiumCalculationServiceProxy,
        OnboardingFieldConfigurationServiceProxy, DocumentRequirementServiceProxy, UserProfileServiceProxy],
    templateUrl: './member-onboarding.component.html',
    styleUrl: './member-onboarding.component.scss'
})
export class MemberOnboardingComponent implements OnInit {
    @Input() viewMode: boolean = false; // When true, form is read-only
    @Input() memberId?: string; // Optional: for admins viewing another member's onboarding
    
    @ViewChild(PersonalInfoStepComponent) personalInfoStep?: PersonalInfoStepComponent;
    @ViewChild(DependentsStepComponent) dependentsStep?: DependentsStepComponent;
    @ViewChild(BeneficiariesStepComponent) beneficiariesStep?: BeneficiariesStepComponent;
    @ViewChild(BankingDetailsStepComponent) bankingDetailsStep?: BankingDetailsStepComponent;
    @ViewChild(TermsStepComponent) termsStep?: TermsStepComponent;
    @ViewChild(SummaryStepComponent) summaryStep?: SummaryStepComponent;

    activeStep = signal(0);
    completionStatus = signal<ProfileCompletionStatusDto | null>(null);
    loading = signal(false);
    refreshing = signal(false); // Separate state for silent refreshes
    initialLoadComplete = false;
    
    // Premium calculation
    premiumCalculation = signal<PremiumCalculationResultDto | null>(null);
    loadingPremium = signal(false);
    showPremium = signal(false); // Show premium on dependents and beneficiaries steps
    
    // Member profile and premium settings
    memberProfile = signal<UserProfileDto | null>(null);
    premiumSettings = signal<PremiumCalculationSettingsDto | null>(null);
    showPremiumSettingsDialog = signal(false);
    loadingSettings = signal(false);
    
    // Dynamic onboarding steps loaded from backend configuration
    stepConfigs = signal<OnboardingStepConfiguration[]>([]);
    steps = signal<{ label: string }[]>([]);
    private stepsConfigLoaded: boolean = false;

    constructor(
        private profileService: MemberProfileCompletionServiceProxy,
        private premiumService: PremiumCalculationServiceProxy,
        private userProfileService: UserProfileServiceProxy,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute,
        private http: HttpClient
    ) {
        // Watch for step changes to show/hide premium and recalculate
        effect(() => {
            const key = this.getActiveStepKey();
            // Show premium on Dependents, Beneficiaries, and Banking Details steps
            const show = key === 'dependents' || key === 'beneficiaries' || key === 'banking-details';
            this.showPremium.set(show);
            if (this.showPremium() && !this.viewMode) {
                this.loadPremiumCalculation();
            }
        });
    }

    private getStepIndexByKey(key: string): number | null {
        const configs = this.stepConfigs();
        if (configs && configs.length) {
            const idx = configs.findIndex(s => s.stepKey === key);
            return idx >= 0 ? idx : null;
        }

        // Fallback to legacy static ordering
        const legacyOrder = [
            'personal-info',
            'dependents',
            'beneficiaries',
            'banking-details',
            'terms',
            'summary',
            'complete'
        ];
        const legacyIdx = legacyOrder.indexOf(key);
        return legacyIdx >= 0 ? legacyIdx : null;
    }

    getActiveStepKey(): string | null {
        const index = this.activeStep();
        const configs = this.stepConfigs();
        if (configs && configs.length && configs[index]) {
            return configs[index].stepKey;
        }

        const legacyOrder = [
            'personal-info',
            'dependents',
            'beneficiaries',
            'banking-details',
            'terms',
            'summary',
            'complete'
        ];
        return legacyOrder[index] ?? null;
    }

    private getStepKeyByIndex(index: number): string | null {
        const configs = this.stepConfigs();
        if (configs && configs.length && configs[index]) {
            return configs[index].stepKey;
        }

        const legacyOrder = [
            'personal-info',
            'dependents',
            'beneficiaries',
            'banking-details',
            'terms',
            'summary',
            'complete'
        ];
        return legacyOrder[index] ?? null;
    }

    getLastStepIndex(): number {
        const configs = this.stepConfigs();
        if (configs && configs.length) {
            return configs.length - 1;
        }
        // Legacy fallback: 7 steps (0-6)
        return 6;
    }

    ngOnInit() {
        // Check query parameters for view mode
        this.route.queryParams.subscribe(params => {
            if (params['view'] === 'true') {
                this.viewMode = true;
            }
            if (params['memberId']) {
                this.memberId = params['memberId'];
            }
        });
        
        // Load dynamic onboarding step configuration and profile status in parallel
        this.loadStepConfigurations();
        this.loadProfileStatus(true); // Initial load with spinner
        this.loadMemberProfile(); // Load member profile for age and cover amount
    }

    private loadStepConfigurations() {
        const url = `${environment.apiUrl}/api/OnboardingStepConfiguration/OnboardingStepConfiguration_GetEnabledSteps`;
        this.http.post<OnboardingStepConfiguration[]>(url, {}).subscribe({
            next: (steps) => {
                const enabled = (steps || []).filter(s => s.isEnabled);
                enabled.sort((a, b) => a.displayOrder - b.displayOrder);
                this.stepConfigs.set(enabled);
                this.steps.set(enabled.map(s => ({ label: s.stepLabel })));
                this.stepsConfigLoaded = true;

                const status = this.completionStatus();
                if (status && !this.initialLoadComplete) {
                    this.determineActiveStep(status);
                    this.initialLoadComplete = true;
                }
            },
            error: (error) => {
                console.error('Error loading onboarding step configuration:', error);
                // Fallback to legacy static steps if configuration fails
                if (this.steps().length === 0) {
                    this.steps.set([
                        { label: 'Personal Information' },
                        { label: 'Dependents' },
                        { label: 'Beneficiaries' },
                        { label: 'Banking Details' },
                        { label: 'Terms & Conditions' },
                        { label: 'Summary & Signature' },
                        { label: 'Complete' }
                    ]);
                }
                this.stepsConfigLoaded = true;

                const status = this.completionStatus();
                if (status && !this.initialLoadComplete) {
                    this.determineActiveStep(status);
                    this.initialLoadComplete = true;
                }
            }
        });
    }

    loadProfileStatus(showSpinner: boolean = false) {
        if (showSpinner) {
            this.loading.set(true);
        } else {
            this.refreshing.set(true);
        }
        
        // Use appropriate method based on whether viewing own or another member's onboarding
        const statusObservable = this.memberId 
            ? this.profileService.profileCompletion_GetStatus(this.memberId)
            : this.profileService.profileCompletion_GetMyStatus();
        
        statusObservable.subscribe({
            next: (response) => {
                const status = response?.result || null;
                this.completionStatus.set(status);
                
                // Allow editing if member status is Pending (even if view=true in query params)
                // This enables members to update their onboarding when admin requests updates
                if (status.memberStatus === 'Pending' && !this.memberId) {
                    this.viewMode = false;
                }
                
                // Only auto-determine step on initial load, after steps are loaded
                if (!this.initialLoadComplete && this.stepsConfigLoaded) {
                    this.determineActiveStep(status);
                    this.initialLoadComplete = true;
                }
                this.loading.set(false);
                this.refreshing.set(false);
            },
            error: (error) => {
                console.error('Error loading profile status:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load profile status'
                });
                this.loading.set(false);
                this.refreshing.set(false);
            }
        });
    }

    determineActiveStep(status: ProfileCompletionStatusDto) {
        // Determine active step based on profile completion flags and configured steps
        const personalIdx = this.getStepIndexByKey('personal-info');
        const dependentsIdx = this.getStepIndexByKey('dependents');
        const beneficiariesIdx = this.getStepIndexByKey('beneficiaries');
        const termsIdx = this.getStepIndexByKey('terms');
        const summaryIdx = this.getStepIndexByKey('summary');

        if (personalIdx !== null && !status.profileCompletion?.hasUploadedIdDocument) {
            this.activeStep.set(personalIdx);
        }
        else if (dependentsIdx !== null && !status.profileCompletion?.hasDependents) {
            this.activeStep.set(dependentsIdx);
        }
        else if (beneficiariesIdx !== null && !status.profileCompletion?.hasBeneficiaries) {
            this.activeStep.set(beneficiariesIdx);
        }
        else if (termsIdx !== null && !status.profileCompletion?.hasAcceptedTerms) {
            this.activeStep.set(termsIdx);
        }
        else if (summaryIdx !== null) {
            // If all previous steps are complete, go to Summary & Signature
            this.activeStep.set(summaryIdx);
        }
        else {
            // Fallback to first step
            this.activeStep.set(0);
        }
    }

    canProceedToNextStep(): boolean {
        const status = this.completionStatus();
        if (!status?.profileCompletion) return false;
        const key = this.getActiveStepKey();

        switch (key) {
            case 'personal-info':
                // Personal Information & Documents - requires ID document upload
                return status.profileCompletion.hasUploadedIdDocument;
            case 'dependents':
                // Dependents
                return status.profileCompletion.hasDependents;
            case 'beneficiaries':
                // Beneficiaries
                return status.profileCompletion.hasBeneficiaries;
            case 'banking-details':
                // Banking details step - optional, can always proceed
                return true;
            case 'terms':
                // Terms & Conditions
                return status.profileCompletion.hasAcceptedTerms;
            case 'summary':
                // Summary & Signature step - requires signature
                return true;
            default:
                return true;
        }
    }

    nextStep() {
        if (this.canProceedToNextStep() && this.activeStep() < this.getLastStepIndex()) {
            this.activeStep.update(step => step + 1);
            // Don't reload, just move to next step
        }
    }

    previousStep() {
        this.activeStep.update(step => Math.max(0, step - 1));
    }

    onStepClick(stepIndex: number) {
        // Allow navigation to any step up to the current active step or completed steps
        const status = this.completionStatus();
        if (!status) return;

        // Can always go back to previous steps
        if (stepIndex <= this.activeStep()) {
            this.activeStep.set(stepIndex);
            return;
        }

        // For forward navigation, enforce sequential completion
        const targetKey = this.getStepKeyByIndex(stepIndex);

        if (targetKey === 'dependents') {
            // Can go to Dependents only if Personal Info (ID upload) is complete
            if (status.profileCompletion?.hasUploadedIdDocument) {
                this.activeStep.set(stepIndex);
            }
        } else if (targetKey === 'beneficiaries') {
            // Can go to Beneficiaries only if Dependents is complete
            if (status.profileCompletion?.hasDependents) {
                this.activeStep.set(stepIndex);
            }
        } else if (targetKey === 'banking-details') {
            // Can go to Banking Details if Beneficiaries is complete
            if (status.profileCompletion?.hasBeneficiaries) {
                this.activeStep.set(stepIndex);
            }
        } else if (targetKey === 'terms') {
            // Can go to Terms if Beneficiaries is complete (Banking is optional)
            if (status.profileCompletion?.hasBeneficiaries) {
                this.activeStep.set(stepIndex);
            }
        } else if (targetKey === 'summary') {
            // Summary step - can navigate if terms accepted
            if (status.profileCompletion?.hasAcceptedTerms) {
                this.activeStep.set(stepIndex);
            }
        } else if (targetKey === 'complete' && status.isComplete) {
            this.activeStep.set(stepIndex);
        }
    }

    onStepComplete() {
        console.log('[OnStepComplete] Event triggered, recalculating profile and premium...');
        
        // Check if this is the final step (Summary & Signature)
        const isFinalStep = this.activeStep() === 5;
        
        // First recalculate the profile status based on actual data
        this.profileService.profileCompletion_RecalculateMy().subscribe({
            next: () => {
                console.log('[OnStepComplete] Profile recalculated, reloading premium...');
                // Then reload profile status silently (no spinner)
                this.loadProfileStatus(false);
                
                // If this is the final step, clear all forms and move to completion
                if (isFinalStep) {
                    console.log('[OnStepComplete] Final step completed, clearing forms and moving to completion...');
                    this.clearAllForms();
                    this.activeStep.set(6); // Move to completion screen
                } else {
                    // Recalculate premium after step completion
                    if (this.showPremium() && !this.viewMode) {
                        console.log('[OnStepComplete] Calling loadPremiumCalculation()...');
                        this.loadPremiumCalculation();
                    } else {
                        console.log('[OnStepComplete] Skipping premium calculation - showPremium:', this.showPremium(), 'viewMode:', this.viewMode);
                    }
                }
            },
            error: (error) => {
                console.error('Error recalculating profile status:', error);
                // Still try to reload even if recalculation fails
                this.loadProfileStatus(false);
            }
        });
    }

    loadPremiumCalculation() {
        console.log('[LoadPremiumCalculation] Fetching latest premium from API...');
        this.loadingPremium.set(true);
        this.premiumService.premiumCalculation_GetMyPremium().subscribe({
            next: (response) => {
                const result = response?.result || null;
                this.premiumCalculation.set(result);
                this.loadingPremium.set(false);
            },
            error: (error) => {
                console.error('[LoadPremiumCalculation] Error calculating premium:', error);
                this.loadingPremium.set(false);
                // Don't show error toast, just silently fail (premium might not be configured yet)
            }
        });
    }

    loadMemberProfile() {
        this.userProfileService.userProfile_GetCurrentUserProfile().subscribe({
            next: (response) => {
                const profile = response?.result || null;
                this.memberProfile.set(profile);
            },
            error: (error) => {
                console.error('[MemberOnboarding] Error loading member profile:', error);
            }
        });
    }
    
    /**
     * Clear all forms after successful onboarding completion
     */
    clearAllForms() {
        console.log('[ClearAllForms] Clearing all onboarding forms...');
        
        // Clear personal info step
        if (this.personalInfoStep) {
            this.personalInfoStep.clearForm();
        }
        
        // Clear dependents step
        if (this.dependentsStep) {
            this.dependentsStep.clearForm();
        }
        
        // Clear beneficiaries step
        if (this.beneficiariesStep) {
            this.beneficiariesStep.clearForm();
        }
        
        // Clear banking details step
        if (this.bankingDetailsStep) {
            this.bankingDetailsStep.clearForm();
        }
        
        // Clear terms step
        if (this.termsStep) {
            this.termsStep.clearForm();
        }
        
        // Clear summary step
        if (this.summaryStep) {
            this.summaryStep.clearForm();
        }
        
        console.log('[ClearAllForms] All forms cleared successfully');
    }

    loadPremiumSettings() {
        this.loadingSettings.set(true);
        this.premiumService.premiumCalculation_GetSettings().subscribe({
            next: (response) => {
                const settings = response?.result || null;
                this.premiumSettings.set(settings);
                this.loadingSettings.set(false);
            },
            error: (error) => {
                console.error('[MemberOnboarding] Error loading premium settings:', error);
                this.loadingSettings.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load premium settings'
                });
            }
        });
    }

    openPremiumSettings() {
        this.showPremiumSettingsDialog.set(true);
        if (!this.premiumSettings()) {
            this.loadPremiumSettings();
        }
    }

    closePremiumSettings() {
        this.showPremiumSettingsDialog.set(false);
    }

    getMemberAge(): number | null {
        const profile = this.memberProfile();
        if (!profile?.dateOfBirth) return null;
        
        const dob = new Date(profile.dateOfBirth.toString());
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Get the cover amount from the member's policy
     * Extracts from premium breakdown or defaults to R10,000
     */
    getCoverAmount(): number {
        const premium = this.premiumCalculation();
        if (!premium?.breakdown || premium.breakdown.length === 0) {
            return 10000; // Default
        }

        // Parse cover amount from breakdown description (e.g., "Base Premium - R10 000 Cover")
        const baseItem = premium.breakdown.find(item => item.category === 'Base');
        if (baseItem?.description) {
            const match = baseItem.description.match(/R\s?([\d\s]+)\s?Cover/);
            if (match) {
                const amountStr = match[1].replace(/\s/g, '');
                return parseInt(amountStr, 10);
            }
        }

        return 10000; // Default
    }

    goToDashboard() {
        this.router.navigate(['/admin/dashboard']);
    }
}
