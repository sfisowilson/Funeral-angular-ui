import { AssetDto, AssetServiceProxy, FileUploadServiceProxy } from '../../core/services/service-proxies';
import { Component, signal, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
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
import { DropdownModule } from 'primeng/dropdown';

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
    selector: 'app-assets',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        DropdownModule
    ],
    templateUrl: './assets.component.html',
    providers: [MessageService, ConfirmationService, AssetServiceProxy]
})
export class AssetsComponent {
    assetDialog: boolean = false;

    assets = signal<AssetDto[]>([]);

    asset!: AssetDto;

    selectedAssets!: AssetDto[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private assetService: AssetServiceProxy,
        private fileService: FileUploadServiceProxy
    ) {}

    downloadFile(fileId: string) {
        this.fileService.file_DownloadFile(fileId).subscribe(
            () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'File Downloaded',
                    life: 3000
                });
            },
            (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'File Download Failed',
                    life: 3000
                });
                console.error('File download error:', error);
            }
        );
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadDemoData();
    }

    loadDemoData() {
        this.assetService.asset_GetAllAssets(undefined, undefined, undefined, undefined, undefined).subscribe((assets) => {
            this.assets.set(assets);
        });

        this.statuses = [
            { label: 'INSTOCK', value: 'instock' },
            { label: 'LOWSTOCK', value: 'lowstock' },
            { label: 'OUTOFSTOCK', value: 'outofstock' }
        ];

        this.cols = [
            { field: 'code', header: 'Code', customExportHeader: 'Asset Code' },
            { field: 'name', header: 'Name' },
            { field: 'image', header: 'Image' },
            { field: 'serialNumber', header: 'SerialNumber', customExportHeader: 'Serial Number' },
            { field: 'type', header: 'Type' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.asset = new AssetDto();
        this.submitted = false;
        this.assetDialog = true;
    }

    editAsset(asset: AssetDto) {
        this.asset = asset;
        this.assetDialog = true;
    }

    deleteSelectedAssets() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected assets?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.assets.set(this.assets().filter((val) => !this.selectedAssets?.includes(val)));
                this.selectedAssets = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Assets Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.assetDialog = false;
        this.submitted = false;
    }

    deleteAsset(asset: AssetDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + asset.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.assets.set(this.assets().filter((val) => val.id !== asset.id));
                this.asset = new AssetDto();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Asset Deleted',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.assets().length; i++) {
            if (this.assets()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    createId(): string {
        let id = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    getSeverity(status: string) {
        switch (status) {
            case 'INSTOCK':
                return 'success';
            case 'LOWSTOCK':
                return 'warn';
            case 'OUTOFSTOCK':
                return 'danger';
            default:
                return 'info';
        }
    }

    saveAsset() {
        this.submitted = true;
        let _assets = this.assets();
        if (this.asset.name?.trim()) {
            if (this.asset.id) {
                _assets[this.findIndexById(this.asset.id)] = this.asset;
                this.assetService.asset_UpdateAsset(this.asset.id, this.asset).subscribe((updatedAsset: AssetDto) => {
                    this.assets.set([..._assets]);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Asset Updated',
                        life: 3000
                    });
                });
            } else {
                // this.asset.image = 'asset-placeholder.svg';
                this.assetService.asset_CreateAsset(this.asset).subscribe(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Asset Created',
                        life: 3000
                    });
                    // _assets.push(this.asset);
                    this.assets.set([..._assets]);
                    this.assets.set([..._assets, this.asset]);
                });
            }

            this.assetDialog = false;
            this.asset = new AssetDto();
        }
    }
}
