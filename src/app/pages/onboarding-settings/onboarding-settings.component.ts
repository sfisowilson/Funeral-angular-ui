import { Component, OnInit, signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsManagementComponent } from './terms-management/terms-management.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { FieldConfigurationComponent } from './field-configuration/field-configuration.component';
import { StepConfigurationComponent } from './step-configuration/step-configuration.component';

@Component({
    selector: 'app-onboarding-settings',
    standalone: true,
    imports: [
        CommonModule,
        TermsManagementComponent,
        RequiredDocumentsComponent,
        FieldConfigurationComponent,
        StepConfigurationComponent
    ],
    schemas: [NO_ERRORS_SCHEMA],
    templateUrl: './onboarding-settings.component.html',
    styleUrl: './onboarding-settings.component.scss'
})
export class OnboardingSettingsComponent implements OnInit {
    activeIndex = signal(0);

    ngOnInit() {
        // Component initialization
    }
}
