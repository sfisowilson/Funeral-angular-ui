import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoliciesService } from '../../core/services/generated/policies/policies.service';
import { PolicyDto } from '../../core/models';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

// TODO: PolicyAttributeDto not yet generated - backend uses custom routes
interface PolicyAttributeDto {
    id?: string;
    policyId?: string;
    property?: string;
    value?: string;
    dataType?: string;
    description?: string;
    isIncluded?: boolean;
}

@Component({
    selector: 'app-policy',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ConfirmDialogModule, DialogModule, InputTextModule, TableModule, ToastModule, ToolbarModule, CheckboxModule, InputNumberModule, TextareaModule],
    providers: [MessageService, ConfirmationService, PoliciesService],
    templateUrl: './policy.component.html',
    styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {
    policy: PolicyDto = {} as PolicyDto;
    policyAttributes = signal<any[]>([]);
    policyAttributeDialog: boolean = false;
    submitted: boolean = false;
    policyAttribute!: any;
    currency: string = 'ZAR'; // Default currency

    constructor(
        private route: ActivatedRoute,
        private policyService: PoliciesService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit(): void {
        const policyId = this.route.snapshot.paramMap.get('id');
        if (policyId && policyId !== 'new') {
            this.policyService.getApiPolicyPolicyGetByIdId<PolicyDto>(policyId).subscribe((policy) => {
                this.policy = policy;
                this.loadPolicyAttributesForPolicy(policyId);
            });
        }
        this.tenantSettingsService.loadSettings().then(() => {
            const settings = this.tenantSettingsService.getSettings();
            if (settings && settings.currency) {
                this.currency = settings.currency;
            }
        });
    }

    loadPolicyAttributesForPolicy(policyId: string) {
        // TODO: Implement when PolicyAttributeService is available
        // this.policyAttributeService.policyAttribute_GetAllPolicies(policyId, undefined, undefined, undefined, undefined, undefined).subscribe((attributes) => {
        //     this.policyAttributes.set(attributes);
        // });
        this.policyAttributes.set([]);
    }

    savePolicy() {
        this.submitted = true;
        if (this.policy.name?.trim() && this.policy.price !== undefined && this.policy.payoutAmount !== undefined) {
            if (this.policy.id) {
                this.policyService.postApiPolicyPolicyUpdatePolicy<PolicyDto>(this.policy).subscribe({
                    next: (updatedPolicy) => {
                        this.policy = updatedPolicy;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Updated',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Error updating policy:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update policy',
                            life: 3000
                        });
                    }
                });
            } else {
                this.policyService.postApiPolicyPolicyCreatePolicy<PolicyDto>(this.policy).subscribe({
                    next: (createdPolicy) => {
                        this.policy = createdPolicy;
                        // Ensure the policy has an ID before allowing attribute creation
                        if (createdPolicy?.id) {
                            this.loadPolicyAttributesForPolicy(createdPolicy.id);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Created',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Error creating policy:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create policy',
                            life: 3000
                        });
                    }
                });
            }
        }
    }

    openNewAttribute() {
        if (!this.policy.id) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please save the policy first before adding attributes',
                life: 3000
            });
            return;
        }
        this.policyAttribute = {
            policyId: this.policy.id
        } as PolicyAttributeDto;
        this.policyAttributeDialog = true;
    }

    editPolicyAttribute(attribute: PolicyAttributeDto) {
        this.policyAttribute = { ...attribute };
        this.policyAttributeDialog = true;
    }

    hideAttributeDialog() {
        this.policyAttributeDialog = false;
        this.submitted = false;
    }

    deletePolicyAttribute(attribute: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this attribute?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // TODO: Implement when PolicyAttributeService is available
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Not Implemented',
                    detail: 'Policy attribute service not yet available',
                    life: 3000
                });
            }
        });
    }

    savePolicyAttribute() {
        console.log('Policy.savePolicyAttribute called -> ', this.policyAttribute);
        this.submitted = true;
        if (this.policyAttribute.policyId?.trim() && this.policyAttribute.property?.trim() && this.policyAttribute.value?.trim()) {
            // TODO: Implement when PolicyAttributeService is available
            this.messageService.add({
                severity: 'warn',
                summary: 'Not Implemented',
                detail: 'Policy attribute service not yet available'
            });
            this.policyAttributeDialog = false;
            this.submitted = false;
        }
    }
}
