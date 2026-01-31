import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StepperFormWidgetComponent } from '../stepper-form-widget/stepper-form-widget.component';
import { WidgetConfig } from '../widget-config';
import { MemberServiceProxy, MemberProfileCompletionServiceProxy, SaveSignatureDto } from '../../core/services/service-proxies';

@Component({
    selector: 'app-onboarding-stepper-widget',
    standalone: true,
    imports: [CommonModule, StepperFormWidgetComponent],
    templateUrl: './onboarding-stepper-widget.component.html',
    styleUrls: ['./onboarding-stepper-widget.component.scss']
})
export class OnboardingStepperWidgetComponent {
    @Input() config!: WidgetConfig;

    saving = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private memberService: MemberServiceProxy,
        private profileCompletionService: MemberProfileCompletionServiceProxy,
        private router: Router
    ) {}

    onSignedAndCompleted(event: { signatureDataUrl: string | null }): void {
        this.errorMessage = '';
        this.successMessage = '';

        const signatureDataUrl = event.signatureDataUrl;
        if (!signatureDataUrl) {
            this.errorMessage = 'Signature is required to complete onboarding.';
            return;
        }

        const dto = new SaveSignatureDto();
        dto.signatureDataUrl = signatureDataUrl;

        this.saving = true;

        this.memberService.member_SaveSignature(dto).subscribe({
            next: () => {
                this.profileCompletionService.profileCompletion_RecalculateMy().subscribe({
                    next: () => {
                        this.saving = false;
                        this.successMessage = 'Onboarding completed successfully.';

                        const redirectUrl = (this.config.settings as any)?.redirectUrl as string | undefined;
                        if (redirectUrl) {
                            this.router.navigateByUrl(redirectUrl);
                        }
                    },
                    error: () => {
                        this.saving = false;
                        this.errorMessage = 'Your signature was saved but we could not update your profile completion status. Please try refreshing the page.';
                    }
                });
            },
            error: () => {
                this.saving = false;
                this.errorMessage = 'We could not save your signature. Please try again.';
            }
        });
    }
}
