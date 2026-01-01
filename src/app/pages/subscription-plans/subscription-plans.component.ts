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
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SubscriptionPlanDto, SubscriptionPlanServiceProxy, TenantType, LookupServiceProxy } from '../../core/services/service-proxies';
import { CheckboxModule } from 'primeng/checkbox';

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
    selector: 'app-subscription-plans',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, DropdownModule, InputNumberModule],
    providers: [MessageService, ConfirmationService, SubscriptionPlanServiceProxy, LookupServiceProxy],
    templateUrl: './subscription-plans.component.html'
})
export class SubscriptionPlansComponent {
    subscriptionPlanDialog: boolean = false;

    subscriptionPlans = signal<SubscriptionPlanDto[]>([]);

    subscriptionPlan!: SubscriptionPlanDto;

    selectedSubscriptionPlans!: SubscriptionPlanDto[] | null;

    submitted: boolean = false;

    tenantTypes: { label: string; value: TenantType }[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private subscriptionPlanService: SubscriptionPlanServiceProxy,
        private lookupService: LookupServiceProxy
    ) {
        this.tenantTypes = [];
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadSubscriptionPlans();
        this.lookupService.getEnumValues('TenantType').subscribe(
            (data: any[]) => {
                this.tenantTypes = data.map((item: any) => ({ label: item.name, value: item.value }));
            },
            (error) => {
                console.error('Error loading tenant types:', error);
            }
        );
    }

    loadSubscriptionPlans() {
        this.subscriptionPlanService.subscriptionPlan_GetAll().subscribe((plans) => {
            this.subscriptionPlans.set(plans);
        });

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'description', header: 'Description' },
            { field: 'monthlyPrice', header: 'Monthly Price' },
            { field: 'allowedTenantType', header: 'Allowed Tenant Type' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.subscriptionPlan = new SubscriptionPlanDto();
        this.submitted = false;
        this.subscriptionPlanDialog = true;
    }

    editSubscriptionPlan(plan: SubscriptionPlanDto) {
        this.subscriptionPlan = SubscriptionPlanDto.fromJS(plan);
        this.subscriptionPlanDialog = true;
    }

    deleteSelectedSubscriptionPlans() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected subscription plans?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // This part needs to call the actual delete API for each selected plan
                // For now, it's just client-side filtering
                this.subscriptionPlans.set(this.subscriptionPlans().filter((val) => !this.selectedSubscriptionPlans?.includes(val)));
                this.selectedSubscriptionPlans = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Subscription Plans Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.subscriptionPlanDialog = false;
        this.submitted = false;
    }

    deleteSubscriptionPlan(plan: SubscriptionPlanDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + plan.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.subscriptionPlanService.subscriptionPlan_Delete(plan.id!).subscribe(() => {
                    this.subscriptionPlans.set(this.subscriptionPlans().filter((val) => val.id !== plan.id));
                    this.subscriptionPlan = new SubscriptionPlanDto();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Subscription Plan Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.subscriptionPlans().length; i++) {
            if (this.subscriptionPlans()[i].id === id) {
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

    saveSubscriptionPlan() {
        this.submitted = true;
        if (this.subscriptionPlan.name?.trim() && this.subscriptionPlan.description?.trim() && this.subscriptionPlan.monthlyPrice !== undefined && this.subscriptionPlan.allowedTenantType !== undefined) {
            if (this.subscriptionPlan.id) {
                this.subscriptionPlanService.subscriptionPlan_Update(this.subscriptionPlan.id, this.subscriptionPlan).subscribe({
                    next: (updatedPlan) => {
                        const currentPlans = this.subscriptionPlans();
                        const index = currentPlans.findIndex((p) => p.id === updatedPlan.id);
                        if (index !== -1) {
                            currentPlans[index] = updatedPlan;
                            this.subscriptionPlans.set([...currentPlans]);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Subscription Plan Updated',
                            life: 3000
                        });
                    },
                    error: (error) => {
                        console.error('Error updating subscription plan:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update subscription plan',
                            life: 3000
                        });
                    }
                });
            } else {
                this.subscriptionPlanService.subscriptionPlan_Create(this.subscriptionPlan).subscribe({
                    next: (createdPlan) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Subscription Plan Created',
                            life: 3000
                        });
                        this.loadSubscriptionPlans(); // Re-fetch data to update the table with the new plan
                    },
                    error: (error) => {
                        console.error('Error creating subscription plan:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create subscription plan',
                            life: 3000
                        });
                    }
                });
            }
            this.subscriptionPlanDialog = false;
            this.subscriptionPlan = new SubscriptionPlanDto();
        }
    }
}
