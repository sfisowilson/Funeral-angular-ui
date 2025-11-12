import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PolicyAttributeDto, PolicyAttributeServiceProxy } from '../../core/services/service-proxies';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-policy-attributes',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        CheckboxModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DropdownModule,
        InputNumberModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService, PolicyAttributeServiceProxy],
    templateUrl: './policy-attributes.component.html',
    styleUrl: './policy-attributes.component.scss'
})
export class PolicyAttributesComponent {
    policyAttributeDialog: boolean = false;

    policyAttributes = signal<PolicyAttributeDto[]>([]);

    policyAttribute!: PolicyAttributeDto;

    selectedPolicyAttributes!: PolicyAttributeDto[] | null;

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private policyAttributeService: PolicyAttributeServiceProxy
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadPolicyAttributes();
    }

    loadPolicyAttributes() {
        this.policyAttributeService.policyAttribute_GetAllPolicies(undefined, undefined, undefined, undefined, undefined, undefined).subscribe((attributes) => {
            this.policyAttributes.set(attributes);
        });

        this.cols = [
            { field: 'policyId', header: 'Policy ID' },
            { field: 'property', header: 'Property' },
            { field: 'value', header: 'Value' },
            { field: 'dataType', header: 'Data Type' },
            { field: 'description', header: 'Description' },
            { field: 'isIncluded', header: 'Is Included' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.policyAttribute = new PolicyAttributeDto();
        this.submitted = false;
        this.policyAttributeDialog = true;
    }

    editPolicyAttribute(attribute: PolicyAttributeDto) {
        this.policyAttribute = PolicyAttributeDto.fromJS(attribute);
        this.policyAttributeDialog = true;
    }

    deleteSelectedPolicyAttributes() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected policy attributes?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // This part needs to call the actual delete API for each selected attribute
                // For now, it's just client-side filtering
                this.policyAttributes.set(this.policyAttributes().filter((val) => !this.selectedPolicyAttributes?.includes(val)));
                this.selectedPolicyAttributes = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Policy Attributes Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.policyAttributeDialog = false;
        this.submitted = false;
    }

    deletePolicyAttribute(attribute: PolicyAttributeDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + attribute.property + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.policyAttributeService.policyAttribute_DeletePolicyAttribute(attribute.id!).subscribe(() => {
                    this.policyAttributes.set(this.policyAttributes().filter((val) => val.id !== attribute.id));
                    this.policyAttribute = new PolicyAttributeDto();
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

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.policyAttributes().length; i++) {
            if (this.policyAttributes()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    savePolicyAttribute() {
        this.submitted = true;
        console.log('PolicyAttributes.savePolicyAttribute called', this.policyAttribute);

        if (
            this.policyAttribute.policyId?.trim() &&
            this.policyAttribute.property?.trim() &&
            this.policyAttribute.value?.trim() &&
            this.policyAttribute.dataType?.trim() &&
            this.policyAttribute.description?.trim() &&
            this.policyAttribute.isIncluded !== undefined
        ) {
            if (this.policyAttribute.id) {
                this.policyAttributeService.policyAttribute_UpdatePolicyAttribute(this.policyAttribute).subscribe({
                    next: (updatedAttribute) => {
                        const currentAttributes = this.policyAttributes();
                        const index = currentAttributes.findIndex((a) => a.id === updatedAttribute.id);
                        if (index !== -1) {
                            currentAttributes[index] = updatedAttribute;
                            this.policyAttributes.set([...currentAttributes]);
                        }
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
                    next: (createdAttribute) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Policy Attribute Created',
                            life: 3000
                        });
                        this.loadPolicyAttributes(); // Re-fetch data to update the table with the new attribute
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
        } else {
            // Surface a helpful warning so the user knows why nothing happened.
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please complete all required fields before saving.',
                life: 4000
            });
            console.log('PolicyAttributes.savePolicyAttribute validation failed', this.policyAttribute);
        }
    }
}
