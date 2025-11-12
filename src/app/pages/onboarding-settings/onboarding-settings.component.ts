import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { TermsManagementComponent } from './terms-management/terms-management.component';
import { RequiredDocumentsComponent } from './required-documents/required-documents.component';
import { FieldConfigurationComponent } from './field-configuration/field-configuration.component';

@Component({
    selector: 'app-onboarding-settings',
    standalone: true,
    imports: [
        CommonModule,
        TabViewModule,
        CardModule,
        TermsManagementComponent,
        RequiredDocumentsComponent,
        FieldConfigurationComponent
    ],
    templateUrl: './onboarding-settings.component.html',
    styleUrl: './onboarding-settings.component.scss'
})
export class OnboardingSettingsComponent implements OnInit {
    activeIndex = signal(0);

    ngOnInit() {
        // Component initialization
    }
}
