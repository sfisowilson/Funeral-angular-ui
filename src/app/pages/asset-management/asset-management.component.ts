import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { ChipsModule } from 'primeng/chips';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// Service Proxies
import { AssetManagementService } from '../../core/services/generated/asset-management/asset-management.service';
import { 
    AssetDto, 
    CreateAssetDto, 
    UpdateAssetDto, 
    AssetCheckoutDto, 
    CheckoutAssetDto, 
    CheckinAssetDto, 
    AssetStatsDto, 
    AssetType, 
    AssetStatus, 
    CheckoutStatus 
} from '../../core/models';

@Component({
    selector: 'app-asset-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        DialogModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        DropdownModule,
        InputNumberModule,
        ConfirmDialogModule,
        TagModule,
        TabViewModule,
        CheckboxModule,
        CalendarModule,
        ChipsModule,
        CardModule,
        IconFieldModule,
        InputIconModule
    ],
    templateUrl: './asset-management.component.html',
    styleUrl: './asset-management.component.scss',
    providers: [MessageService, ConfirmationService]
})
export class AssetManagementComponent implements OnInit {
    // View Child
    @ViewChild('dt') dt!: Table;

    // Signals for reactive state
    assets = signal<AssetDto[]>([]);
    checkouts = signal<AssetCheckoutDto[]>([]);
    stats = signal<AssetStatsDto | null>(null);
    loading = signal<boolean>(false);

    // Dialog flags
    assetDialog: boolean = false;
    checkoutDialog: boolean = false;
    checkinDialog: boolean = false;
    inspectionDialog: boolean = false;
    maintenanceDialog: boolean = false;

    // Current entities
    asset: any = {};  // Use any to avoid union type issues
    checkout: CheckoutAssetDto = {} as CheckoutAssetDto;
    checkin: CheckinAssetDto = {} as CheckinAssetDto;
    inspection: any = {};

    // Submitted flags
    submitted: boolean = false;

    // Dropdowns
    assetTypes: any[] = [
        { label: 'Vehicle', value: AssetType.Vehicle },
        { label: 'Tent', value: AssetType.Tent },
        { label: 'Equipment', value: AssetType.Equipment },
        { label: 'Refrigeration', value: AssetType.Refrigeration },
        { label: 'Furniture', value: AssetType.Furniture },
        { label: 'Tools', value: AssetType.Tools },
        { label: 'Other', value: AssetType.Other }
    ];

    assetStatuses: any[] = [
        { label: 'Available', value: AssetStatus.Available },
        { label: 'Checked Out', value: AssetStatus.CheckedOut },
        { label: 'Under Maintenance', value: AssetStatus.UnderMaintenance },
        { label: 'Out of Service', value: AssetStatus.OutOfService },
        { label: 'Retired', value: AssetStatus.Retired }
    ];

    checkoutStatuses: any[] = [
        { label: 'Active', value: CheckoutStatus.Active },
        { label: 'Returned', value: CheckoutStatus.Returned },
        { label: 'Overdue', value: CheckoutStatus.Overdue },
        { label: 'Cancelled', value: CheckoutStatus.Cancelled }
    ];

    // Inspection checkpoints
    checkpoints: string[] = [];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private assetManagementService: AssetManagementService
    ) {}

    ngOnInit() {
        this.loadAssets();
        this.loadCheckouts();
        this.loadStats();
    }

    loadAssets() {
        this.loading.set(true);
        this.assetManagementService.getApiAssetManagementAssetManagementGetAll<AssetDto[]>().subscribe({
            next: (data: AssetDto[]) => {
                this.assets.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load assets' });
                this.loading.set(false);
            }
        });
    }

    loadCheckouts() {
        this.assetManagementService.getApiAssetManagementAssetManagementGetActiveCheckouts<any[]>().subscribe({
            next: (data: AssetCheckoutDto[]) => {
                this.checkouts.set(data);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load checkouts' });
            }
        });
    }

    loadStats() {
        this.assetManagementService.getApiAssetManagementAssetManagementGetStats<any>().subscribe({
            next: (data: AssetStatsDto) => {
                this.stats.set(data);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load stats' });
            }
        });
    }

    // Asset CRUD Operations
    openNew() {
        this.asset = {
            requiresInspection: true,
            quantity: 1,
            inspectionCheckpoints: []
        };
        this.submitted = false;
        this.assetDialog = true;
    }

    editAsset(asset: AssetDto) {
        this.asset = { ...asset } as any;  // Use any to avoid type conversion issues
        this.checkpoints = (asset as any).inspectionCheckpoints ? [...(asset as any).inspectionCheckpoints] : [];
        this.assetDialog = true;
    }

    deleteAsset(asset: AssetDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + asset.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.assetManagementService.deleteApiAssetManagementAssetManagementDeleteId<any>(asset.id!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Asset Deleted', life: 3000 });
                        this.loadAssets();
                        this.loadStats();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete asset', life: 3000 });
                    }
                });
            }
        });
    }

    saveAsset() {
        this.submitted = true;

        if (this.asset.name?.trim()) {
            this.asset.inspectionCheckpoints = this.checkpoints;

            if ('id' in this.asset && this.asset.id) {
                // Update
                this.assetManagementService.putApiAssetManagementAssetManagementUpdate<AssetDto>(this.asset as UpdateAssetDto).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Asset Updated', life: 3000 });
                        this.assetDialog = false;
                        this.asset = {};
                        this.loadAssets();
                        this.loadStats();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update asset', life: 3000 });
                    }
                });
            } else {
                // Create
                this.assetManagementService.postApiAssetManagementAssetManagementCreate<AssetDto>(this.asset as CreateAssetDto).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Asset Created', life: 3000 });
                        this.assetDialog = false;
                        this.asset = {} as CreateAssetDto;
                        this.loadAssets();
                        this.loadStats();
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create asset', life: 3000 });
                    }
                });
            }
        }
    }

    hideDialog() {
        this.assetDialog = false;
        this.checkoutDialog = false;
        this.checkinDialog = false;
        this.inspectionDialog = false;
        this.maintenanceDialog = false;
        this.submitted = false;
    }

    // Checkout Operations
    checkoutAsset(asset: AssetDto) {
        this.checkout = {
            assetId: asset.id!
        } as CheckoutAssetDto;
        this.checkoutDialog = true;
    }

    saveCheckout() {
        this.submitted = true;

        if (this.checkout.assetId) {
            this.assetManagementService.postApiAssetManagementAssetManagementCheckout<any>(this.checkout).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Asset Checked Out', life: 3000 });
                    this.checkoutDialog = false;
                    this.checkout = {} as CheckoutAssetDto;
                    this.loadAssets();
                    this.loadCheckouts();
                    this.loadStats();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to checkout asset', life: 3000 });
                }
            });
        }
    }

    // Checkin Operations
    checkinAsset(checkout: AssetCheckoutDto) {
        this.checkin = {
            checkoutId: checkout.id!,
            returnedInGoodCondition: true
        } as CheckinAssetDto;
        this.checkinDialog = true;
    }

    saveCheckin() {
        this.submitted = true;

        if (this.checkin.checkoutId) {
            this.assetManagementService.postApiAssetManagementAssetManagementCheckin<any>(this.checkin).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Asset Checked In', life: 3000 });
                    this.checkinDialog = false;
                    this.checkin = {} as CheckinAssetDto;
                    this.loadAssets();
                    this.loadCheckouts();
                    this.loadStats();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to checkin asset', life: 3000 });
                }
            });
        }
    }

    // Schedule Maintenance
    scheduleMaintenance(asset: any) {
        this.asset = { ...asset };
        this.maintenanceDialog = true;
    }

    saveMaintenance() {
        this.submitted = true;

        if (this.asset.id && this.asset.nextMaintenanceDate) {
            // TODO: Implement with service proxy
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Maintenance Scheduled', life: 3000 });
            this.maintenanceDialog = false;
            this.asset = {};
            this.loadAssets();
        }
    }

    // Utility Methods
    getStatusSeverity(status: number): string {
        switch (status) {
            case 0: return 'success';  // Available
            case 1: return 'info';     // Checked Out
            case 2: return 'warn';     // Under Maintenance
            case 3: return 'danger';   // Out of Service
            case 4: return 'secondary'; // Retired
            default: return 'secondary';
        }
    }

    getCheckoutStatusSeverity(status: number): string {
        switch (status) {
            case 0: return 'info';     // Checked Out
            case 1: return 'success';  // Checked In
            case 2: return 'danger';   // Overdue
            case 3: return 'secondary'; // Cancelled
            default: return 'secondary';
        }
    }

    getAssetTypeName(type: number): string {
        const assetType = this.assetTypes.find(t => t.value === type);
        return assetType ? assetType.label : 'Unknown';
    }

    getAssetStatusName(status: number): string {
        const assetStatus = this.assetStatuses.find(s => s.value === status);
        return assetStatus ? assetStatus.label : 'Unknown';
    }

    onGlobalFilter(event: Event) {
        const input = event.target as HTMLInputElement;
        this.dt.filterGlobal(input.value, 'contains');
    }
}
