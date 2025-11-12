import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PolicyDto, PolicyServiceProxy } from '../../core/services/service-proxies';
import { CheckboxModule } from 'primeng/checkbox';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

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
    selector: 'app-policies',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, DropdownModule, CheckboxModule],
    providers: [MessageService, ConfirmationService, PolicyServiceProxy],
    templateUrl: './policies.component.html'
})
export class PoliciesComponent {
    policies = signal<PolicyDto[]>([]);

    policy!: PolicyDto;

    selectedPolicies!: PolicyDto[] | null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];
    currency: string = 'ZAR'; // Default currency

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private policyService: PolicyServiceProxy,
        private router: Router,
        private tenantSettingsService: TenantSettingsService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadPolicies();
        this.tenantSettingsService.loadSettings().then(() => {
            const tenantSettings = this.tenantSettingsService.getSettings();
            console.log('Tenant settings loaded:', tenantSettings);
            let settings = JSON.parse(tenantSettings?.settings) || '{}';
            if (settings && settings.currency) {
                this.currency = settings.currency;
            }
        });
    }

    loadPolicies() {
        this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe((policies) => {
            this.policies.set(policies);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'price', header: 'Price' },
            { field: 'payoutAmount', header: 'Payout Amount' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/admin/pages/policy/new']);
    }

    editPolicy(policy: PolicyDto) {
        this.router.navigate(['/admin/pages/policy', policy.id]);
    }

    deleteSelectedPolicies() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected policies?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // This part needs to call the actual delete API for each selected policy
                // For now, it's just client-side filtering
                this.policies.set(this.policies().filter((val) => !this.selectedPolicies?.includes(val)));
                this.selectedPolicies = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Policies Deleted',
                    life: 3000
                });
            }
        });
    }

    deletePolicy(policy: PolicyDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + policy.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.policyService.policy_DeletePolicy(policy.id!).subscribe(() => {
                    this.policies.set(this.policies().filter((val) => val.id !== policy.id));
                    this.policy = new PolicyDto();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Policy Deleted',
                        life: 3000
                    });
                });
            }
        });
    }
}
