import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TenantCreateUpdateDto } from '../../core/models';
import { TenantService } from '../../core/services/generated/tenant/tenant.service';
import { LookupService } from '../../core/services/generated/lookup/lookup.service';

// TODO: Move to backend when migrated
export enum TenantType {
    Individual = 0,
    Organization = 1,
    Funeral = 2
}

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
    selector: 'app-tenants',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, DropdownModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './tenants.component.html'
})
export class TenantsComponent {
    tenantDialog: boolean = false;

    tenants = signal<TenantCreateUpdateDto[]>([]);

    tenant!: TenantCreateUpdateDto;

    selectedTenants!: TenantCreateUpdateDto[] | null;

    submitted: boolean = false;

    tenantTypes: { label: string; value: TenantType }[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private tenantService: TenantService,
        private lookupService: LookupService
    ) {
        this.tenantTypes = []; // Initialize as empty, will be populated by lookup
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadDemoData();
    }

    async loadDemoData() {
        this.tenantService.getApiTenantTenantGetAllTenants<any[]>().subscribe((tenants) => {
            this.tenants.set(tenants as any[] || []);
        });

        this.lookupService.getApiLookupGetEnumValuesEnumTypeName('TenantType').subscribe({
            next: (data: any[]) => {
                this.tenantTypes = data.map((item: any) => ({ label: item.name, value: item.value }));
            },
            error: (error: any) => {
                console.error('Error loading tenant types:', error);
            }
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'domain', header: 'Domain' },
            { field: 'address', header: 'Address' },
            { field: 'phone1', header: 'Phone 1' },
            { field: 'phone2', header: 'Phone 2' },
            { field: 'registrationNumber', header: 'Registration Number' },
            { field: 'type', header: 'Type' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.tenant = {} as TenantCreateUpdateDto;
        this.submitted = false;
        this.tenantDialog = true;
    }

    editTenant(tenant: TenantCreateUpdateDto) {
        this.tenant = { ...tenant };
        this.tenantDialog = true;
    }

    deleteSelectedTenants() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected tenants?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // This part needs to call the actual delete API for each selected tenant
                // For now, it's just client-side filtering
                this.tenants.set(this.tenants().filter((val) => !this.selectedTenants?.includes(val)));
                this.selectedTenants = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Tenants Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.tenantDialog = false;
        this.submitted = false;
    }

    deleteTenant(tenant: TenantCreateUpdateDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + tenant.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.tenantService.deleteApiTenantTenantDeleteTenantId(tenant.id!).subscribe(() => {
                    this.tenants.set(this.tenants().filter((val) => val.id !== tenant.id));
                    this.tenant = {} as TenantCreateUpdateDto;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Tenant Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.tenants().length; i++) {
            if (this.tenants()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    getTenantTypeName(type: number): string {
        const foundType = this.tenantTypes.find((t) => t.value === type);
        return foundType ? foundType.label : 'Unknown';
    }

    saveTenant() {
        this.submitted = true;
        if (this.tenant.name?.trim() && this.tenant.email?.trim() && this.tenant.domain?.trim() && this.tenant.address?.trim() && this.tenant.phone1?.trim() && this.tenant.registrationNumber?.trim() && this.tenant.type !== undefined) {
            if (this.tenant.id) {
                this.tenantService.putApiTenantTenantUpdateTenantId<any>(this.tenant.id, this.tenant as any).subscribe({
                    next: (success) => {
                        // Service returns void, just check the call succeeded
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Tenant Updated',
                            life: 3000
                        });
                        this.loadDemoData(); // Re-fetch data to update the table
                    },
                    error: (error: any) => {
                        console.error('Error updating tenant:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update tenant',
                            life: 3000
                        });
                    }
                });
            } else {
                this.tenantService.postApiTenantTenantRegisterTenant<any>(this.tenant as any).subscribe({
                    next: (registered) => {
                        // Service returns void, just check the call succeeded
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Tenant Created',
                            life: 3000
                        });
                        this.loadDemoData(); // Re-fetch data to update the table
                    },
                    error: (error: any) => {
                        console.error('Error creating tenant:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create tenant',
                            life: 3000
                        });
                    }
                });
            }
            this.tenantDialog = false;
            this.tenant = {} as TenantCreateUpdateDto;
        }
    }
}
