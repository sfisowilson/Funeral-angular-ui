import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PolicyDto, PolicyServiceProxy, PolicyAttributeDto, PolicyAttributeServiceProxy } from '../../core/services/service-proxies';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
    selector: 'app-policy',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ConfirmDialogModule, DialogModule, InputTextModule, TableModule, ToastModule, ToolbarModule, CheckboxModule, InputNumberModule, TextareaModule],
    providers: [MessageService, ConfirmationService, PolicyServiceProxy, PolicyAttributeServiceProxy],
    templateUrl: './policy.component.html',
    styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit {
    policy: PolicyDto = new PolicyDto();
    policyAttributes = signal<PolicyAttributeDto[]>([]);
    policyAttributeDialog: boolean = false;
    submitted: boolean = false;
    policyAttribute!: PolicyAttributeDto;
    currency: string = 'ZAR'; // Default currency

    constructor(
        private route: ActivatedRoute,
        private policyService: PolicyServiceProxy,
        private policyAttributeService: PolicyAttributeServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit(): void {
        const policyId = this.route.snapshot.paramMap.get('id');
        if (policyId && policyId !== 'new') {
            this.policyService.policy_GetById(policyId).subscribe((policy) => {
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
        this.policyAttributeService.policyAttribute_GetAllPolicies(policyId, undefined, undefined, undefined, undefined, undefined).subscribe((attributes) => {
            this.policyAttributes.set(attributes);
        });
    }

    savePolicy() {
        this.submitted = true;
        if (this.policy.name?.trim() && this.policy.price !== undefined && this.policy.payoutAmount !== undefined) {
            if (this.policy.id) {
                this.policyService.policy_UpdatePolicy(this.policy).subscribe({
                    next: (updatedPolicy) => {
                        this.policy = updatedPolicy;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Updated',
                            life: 3000
                        });
                    },
                    error: (error) => {
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
                this.policyService.policy_CreatePolicy(this.policy).subscribe({
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
                    error: (error) => {
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
        this.policyAttribute = new PolicyAttributeDto();
        this.policyAttribute.policyId = this.policy.id;
        this.policyAttributeDialog = true;
    }

    editPolicyAttribute(attribute: PolicyAttributeDto) {
        this.policyAttribute = PolicyAttributeDto.fromJS(attribute);
        this.policyAttributeDialog = true;
    }

    hideAttributeDialog() {
        this.policyAttributeDialog = false;
        this.submitted = false;
    }

    deletePolicyAttribute(attribute: PolicyAttributeDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this attribute?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.policyAttributeService.policyAttribute_DeletePolicyAttribute(attribute.id!).subscribe(() => {
                    this.loadPolicyAttributesForPolicy(this.policy.id!);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Policy Attribute Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    savePolicyAttribute() {
        console.log('Policy.savePolicyAttribute called -> ', this.policyAttribute);
        this.submitted = true;
        if (this.policyAttribute.policyId?.trim() && this.policyAttribute.property?.trim() && this.policyAttribute.value?.trim()) {
            if (this.policyAttribute.id) {
                this.policyAttributeService.policyAttribute_UpdatePolicyAttribute(this.policyAttribute).subscribe({
                    next: () => {
                        this.loadPolicyAttributesForPolicy(this.policy.id!);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Attribute Updated',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        console.error('Error updating policy attribute:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update policy attribute',
                            life: 3000
                        });
                    }
                });
            } else {
                this.policyAttributeService.policyAttribute_CreatePolicyAttribute(this.policyAttribute).subscribe({
                    next: () => {
                        this.loadPolicyAttributesForPolicy(this.policy.id!);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Attribute Created',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        console.error('Error creating policy attribute:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create policy attribute',
                            life: 3000
                        });
                    }
                });
            }
            this.policyAttributeDialog = false;
            this.policyAttribute = new PolicyAttributeDto();
        }
    }
}
