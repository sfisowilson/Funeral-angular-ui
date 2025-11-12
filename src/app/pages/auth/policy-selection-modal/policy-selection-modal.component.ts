import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PolicyDto, PolicyServiceProxy } from '../../../core/services/service-proxies';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { TenantSettingsService } from '../../../core/services/tenant-settings.service';

@Component({
    selector: 'app-policy-selection-modal',
    standalone: true,
    imports: [CommonModule, DividerModule, ButtonModule, RippleModule, TableModule, RadioButtonModule, FormsModule],
    providers: [PolicyServiceProxy, TenantSettingsService],
    templateUrl: './policy-selection-modal.component.html',
    styleUrls: ['./policy-selection-modal.component.scss']
})
export class PolicySelectionModalComponent implements OnInit {
    policies: PolicyDto[] = [];
    selectedPolicy: PolicyDto | null = null;
    currency: string = 'ZAR'; // Default currency
    loading: boolean = true;

    constructor(
        public ref: DynamicDialogRef,
        public config: DynamicDialogConfig,
        private policyService: PolicyServiceProxy,
        private tenantSettingsService: TenantSettingsService
    ) {}

    async ngOnInit(): Promise<void> {
        try {
            // Load tenant settings for currency
            await this.tenantSettingsService.loadSettings();
            const settings = this.tenantSettingsService.getSettings();
            if (settings && settings.currency) {
                this.currency = settings.currency;
            }

            // Load policies
            this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe({
                next: (policies) => {
                    this.policies = policies;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading policies:', error);
                    this.loading = false;
                }
            });
        } catch (error) {
            console.error('Error initializing policy selection:', error);
            this.loading = false;
        }
    }

    selectPolicy(policy: PolicyDto) {
        this.selectedPolicy = policy;
        // Close the dialog immediately when a policy is selected
        setTimeout(() => {
            this.ref.close(this.selectedPolicy);
        }, 150); // Small delay for visual feedback
    }

    confirmSelection() {
        if (this.selectedPolicy) {
            this.ref.close(this.selectedPolicy);
        }
    }

    cancelSelection() {
        this.ref.close(null);
    }
}
