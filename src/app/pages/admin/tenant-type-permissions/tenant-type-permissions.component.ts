import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TenantTypePermissionServiceProxy, TenantType, LookupServiceProxy, AssignPermissionDto, RemovePermissionDto, TenantTypePermission, PermissionServiceProxy, Permission } from '../../../core/services/service-proxies';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

interface NewPermission {
    tenantType: TenantType;
    permissionName: string;
    description: string;
}

@Component({
    selector: 'app-tenant-type-permissions',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, DropdownModule, TagModule, MultiSelectModule],
    providers: [MessageService, ConfirmationService, TenantTypePermissionServiceProxy, LookupServiceProxy, PermissionServiceProxy],
    templateUrl: './tenant-type-permissions.component.html',
    styles: [`
        :host ::ng-deep .p-multiselect-panel {
            position: fixed !important;
            z-index: 9999 !important;
        }
        
        :host ::ng-deep .p-multiselect-panel .p-multiselect-items-wrapper {
            max-height: 300px !important;
            overflow-y: auto !important;
        }
        
        :host ::ng-deep .p-dialog {
            z-index: 1000 !important;
        }
    `]
})
export class TenantTypePermissionsComponent {
    permissionDialog: boolean = false;

    permissions = signal<TenantTypePermission[]>([]);

    newPermission!: NewPermission;

    selectedPermissions!: TenantTypePermission[] | null;

    submitted: boolean = false;

    tenantTypes: { label: string; value: TenantType }[];

    selectedTenantType: TenantType | null = null;

    // Permission management properties
    availablePermissions = signal<Permission[]>([]);
    selectedPermissionsForTenantType: Permission[] = [];
    originalTenantTypePermissions: TenantTypePermission[] = [];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private tenantTypePermissionService: TenantTypePermissionServiceProxy,
        private lookupService: LookupServiceProxy,
        private permissionService: PermissionServiceProxy
    ) {
        this.tenantTypes = [];
        this.newPermission = {
            tenantType: TenantType._0, // Basic
            permissionName: '',
            description: ''
        };
    }

    ngOnInit() {
        this.loadTenantTypes();
        this.loadAvailablePermissions();
        this.loadPermissions();
        this.setupColumns();
    }

    loadAvailablePermissions() {
        this.permissionService.permission_GetAllPermissions().subscribe({
            next: (permissions: Permission[]) => {
                this.availablePermissions.set(permissions);
            },
            error: (error: any) => {
                console.error('Error loading available permissions:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load available permissions',
                    life: 3000
                });
            }
        });
    }

    loadTenantTypes() {
        this.lookupService.getEnumValues('TenantType').subscribe({
            next: (data: any[]) => {
                this.tenantTypes = data.map((item: any) => ({ label: item.name, value: item.value }));
            },
            error: (error) => {
                console.error('Error loading tenant types:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load tenant types',
                    life: 3000
                });
            }
        });
    }

    loadPermissions() {
        if (this.selectedTenantType !== null) {
            this.tenantTypePermissionService.getPermissionsByTenantType(this.selectedTenantType).subscribe({
                next: (permissions: TenantTypePermission[]) => {
                    this.permissions.set(permissions);
                },
                error: (error: any) => {
                    console.error('Error loading permissions:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load permissions',
                        life: 3000
                    });
                }
            });
        } else {
            this.permissions.set([]);
        }
    }

    setupColumns() {
        this.cols = [
            { field: 'permissionName', header: 'Permission Name' },
            { field: 'description', header: 'Description' },
            { field: 'tenantType', header: 'Tenant Type' },
            { field: 'createdAt', header: 'Created At' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onTenantTypeChange() {
        this.loadPermissions();
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.newPermission = {
            tenantType: this.selectedTenantType || TenantType._0, // Basic
            permissionName: '',
            description: ''
        };
        this.submitted = false;
        this.permissionDialog = true;
    }

    openPermissionDialog() {
        if (!this.selectedTenantType) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a tenant type first',
                life: 3000
            });
            return;
        }

        // Store original permissions
        this.originalTenantTypePermissions = [...this.permissions()];
        
        // Find available permissions that are already assigned to this tenant type
        this.selectedPermissionsForTenantType = this.availablePermissions().filter((permission) => 
            this.originalTenantTypePermissions.some((ttp) => ttp.permissionName === permission.name)
        );
        
        this.permissionDialog = true;
    }

    savePermissions() {
        if (!this.selectedTenantType) {
            return;
        }

        // Permissions to add
        const permissionsToAdd = this.selectedPermissionsForTenantType.filter((selectedPerm) => 
            !this.originalTenantTypePermissions.some((originalPerm) => originalPerm.permissionName === selectedPerm.name)
        );

        // Permissions to remove
        const permissionsToRemove = this.originalTenantTypePermissions.filter((originalPerm) => 
            !this.selectedPermissionsForTenantType.some((selectedPerm) => selectedPerm.name === originalPerm.permissionName)
        );

        if (permissionsToAdd.length === 0 && permissionsToRemove.length === 0) {
            this.messageService.add({
                severity: 'info',
                summary: 'No Changes',
                detail: 'No permission changes to save',
                life: 3000
            });
            this.permissionDialog = false;
            return;
        }

        let completedCount = 0;
        const totalOperations = permissionsToAdd.length + permissionsToRemove.length;
        let hasError = false;

        // Add permissions
        permissionsToAdd.forEach((permission) => {
            const assignDto = new AssignPermissionDto();
            assignDto.tenantType = this.selectedTenantType!;
            assignDto.permissionName = permission.name;
            assignDto.description = `Permission for ${this.getTenantTypeName(this.selectedTenantType!)}`;
            
            this.tenantTypePermissionService.assignPermissionToTenantType(assignDto).subscribe({
                next: () => {
                    completedCount++;
                    checkCompletion();
                },
                error: (error: any) => {
                    hasError = true;
                    completedCount++;
                    console.error('Failed to assign permission:', error);
                    checkCompletion();
                }
            });
        });

        // Remove permissions
        permissionsToRemove.forEach((permission) => {
            const removeDto = new RemovePermissionDto();
            removeDto.tenantType = this.selectedTenantType!;
            removeDto.permissionName = permission.permissionName;
            
            this.tenantTypePermissionService.removePermissionFromTenantType(removeDto).subscribe({
                next: () => {
                    completedCount++;
                    checkCompletion();
                },
                error: (error: any) => {
                    hasError = true;
                    completedCount++;
                    console.error('Failed to remove permission:', error);
                    checkCompletion();
                }
            });
        });

        const checkCompletion = () => {
            if (completedCount === totalOperations) {
                this.loadPermissions();
                this.permissionDialog = false;
                
                if (hasError) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Partial Success',
                        detail: 'Some permissions were updated, but some failed',
                        life: 3000
                    });
                } else {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Updated ${permissionsToAdd.length} added, ${permissionsToRemove.length} removed permissions`,
                        life: 3000
                    });
                }
            }
        };
    }

    hideDialog() {
        this.permissionDialog = false;
        this.submitted = false;
    }

    savePermission() {
        this.submitted = true;
        if (this.newPermission.permissionName?.trim() && this.newPermission.description?.trim() && this.newPermission.tenantType !== undefined) {
            const assignDto = new AssignPermissionDto();
            assignDto.tenantType = this.newPermission.tenantType;
            assignDto.permissionName = this.newPermission.permissionName;
            assignDto.description = this.newPermission.description;
            
            this.tenantTypePermissionService.assignPermissionToTenantType(assignDto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Permission assigned successfully',
                        life: 3000
                    });
                    this.loadPermissions();
                    this.permissionDialog = false;
                    this.newPermission = {
                        tenantType: TenantType._0, // Basic
                        permissionName: '',
                        description: ''
                    };
                },
                error: (error) => {
                    console.error('Error assigning permission:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to assign permission',
                        life: 3000
                    });
                }
            });
        }
    }

    deletePermission(permission: TenantTypePermission) {
        this.confirmationService.confirm({
            message: `Are you sure you want to remove permission "${permission.permissionName}" from ${this.getTenantTypeName(permission.tenantType)}?`,
            header: 'Confirm Remove Permission',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const removeDto = new RemovePermissionDto();
                removeDto.tenantType = permission.tenantType;
                removeDto.permissionName = permission.permissionName;
                
                this.tenantTypePermissionService.removePermissionFromTenantType(removeDto).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Permission removed successfully',
                            life: 3000
                        });
                        this.loadPermissions();
                    },
                    error: (error) => {
                        console.error('Error removing permission:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to remove permission',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    deleteSelectedPermissions() {
        if (this.selectedPermissions && this.selectedPermissions.length > 0) {
            this.confirmationService.confirm({
                message: `Are you sure you want to remove ${this.selectedPermissions.length} selected permissions?`,
                header: 'Confirm Remove Permissions',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    let completed = 0;
                    let errors = 0;
                    const total = this.selectedPermissions!.length;

                    this.selectedPermissions!.forEach(permission => {
                        const removeDto = new RemovePermissionDto();
                        removeDto.tenantType = permission.tenantType;
                        removeDto.permissionName = permission.permissionName;
                        
                        this.tenantTypePermissionService.removePermissionFromTenantType(removeDto).subscribe({
                            next: () => {
                                completed++;
                                if (completed + errors === total) {
                                    this.loadPermissions();
                                    if (errors === 0) {
                                        this.messageService.add({
                                            severity: 'success',
                                            summary: 'Success',
                                            detail: `${completed} permissions removed successfully`,
                                            life: 3000
                                        });
                                    } else {
                                        this.messageService.add({
                                            severity: 'warn',
                                            summary: 'Partial Success',
                                            detail: `${completed} permissions removed, ${errors} failed`,
                                            life: 3000
                                        });
                                    }
                                    this.selectedPermissions = null;
                                }
                            },
                            error: (error) => {
                                errors++;
                                console.error('Error removing permission:', error);
                                if (completed + errors === total) {
                                    this.loadPermissions();
                                    this.messageService.add({
                                        severity: 'warn',
                                        summary: 'Partial Success',
                                        detail: `${completed} permissions removed, ${errors} failed`,
                                        life: 3000
                                    });
                                    this.selectedPermissions = null;
                                }
                            }
                        });
                    });
                }
            });
        }
    }

    seedDefaultPermissions() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to seed default permissions for all tenant types? This will create the standard permission sets for Basic, Standard, and Premium tenants.',
            header: 'Confirm Seed Default Permissions',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.tenantTypePermissionService.seedDefaultPermissions().subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Default permissions seeded successfully for all tenant types',
                            life: 5000
                        });
                        this.loadPermissions();
                    },
                    error: (error) => {
                        console.error('Error seeding default permissions:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to seed default permissions',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    getTenantTypeName(type: TenantType): string {
        const foundType = this.tenantTypes.find((t) => t.value === type);
        return foundType ? foundType.label : 'Unknown';
    }

    getTenantTypeSeverity(type: TenantType): string {
        switch (type) {
            case TenantType._0: // Basic
                return 'info';
            case TenantType._1: // Standard
                return 'warning';
            case TenantType._2: // Premium
                return 'success';
            default:
                return 'secondary';
        }
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString();
    }
}
