import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RoleServiceProxy, Role, PermissionServiceProxy, Permission, RolePermissionServiceProxy, RolePermission, RoleDto, PermissionDto, RoleInput, CreateRolePermissionDto, TenantTypePermissionServiceProxy, TenantTypePermission, TenantSettingServiceProxy, TenantSettingDto, TenantType } from '../../core/services/service-proxies';
import { MultiSelectModule } from 'primeng/multiselect';
import { TenantService } from '../../core/services/tenant.service';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, MultiSelectModule],
    providers: [MessageService, ConfirmationService, RoleServiceProxy, PermissionServiceProxy, RolePermissionServiceProxy, TenantTypePermissionServiceProxy],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent {
    roleDialog: boolean = false;

    roles = signal<RoleDto[]>([]);

    role!: RoleDto;

    selectedRoles!: RoleDto[] | null;

    permissionDialog: boolean = false;
    availablePermissions = signal<Permission[]>([]);
    selectedPermissions: Permission[] = [];
    originalRolePermissions: RolePermission[] = [];

    // Tenant-type aware properties
    currentTenantType: TenantType | null = null;
    tenantTypePermissions: TenantTypePermission[] = [];
    filteredPermissions = signal<Permission[]>([]);

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private roleService: RoleServiceProxy,
        private permissionService: PermissionServiceProxy,
        private rolePermissionService: RolePermissionServiceProxy,
        private tenantTypePermissionService: TenantTypePermissionServiceProxy,
        private tenantSettingService: TenantSettingServiceProxy,
        private tenantService: TenantService
    ) {}

    ngOnInit() {
        this.loadRoles();
        this.loadCurrentTenantType();
    }

    loadCurrentTenantType() {
        this.tenantSettingService.tenantSetting_GetCurrentTenantSettings().subscribe({
            next: (tenantSettings: TenantSettingDto) => {
                // Get tenant ID from settings or tenant service
                const tenantId = this.tenantService.getTenantId();
                if (tenantId && tenantId !== 'host') {
                    // For non-host tenants, we need to get the tenant details to get the type
                    // For now, let's assume we can get it from somewhere or default to Basic
                    // TODO: Implement proper current tenant type retrieval
                    this.currentTenantType = TenantType._0; // Default to Basic for now
                    this.loadPermissions();
                } else {
                    // For host, show all permissions
                    this.currentTenantType = null;
                    this.loadPermissions();
                }
            },
            error: (error: any) => {
                console.error('Error loading current tenant settings:', error);
                // Default to showing all permissions if we can't determine tenant type
                this.currentTenantType = null;
                this.loadPermissions();
            }
        });
    }

    loadRoles() {
        this.roleService.role_GetAllRoles().subscribe((roles) => {
            this.roles.set(roles);
        });
    }

    loadPermissions() {
        this.permissionService.permission_GetAllPermissions().subscribe({
            next: (allPermissions: Permission[]) => {
                this.availablePermissions.set(allPermissions);
                
                if (this.currentTenantType !== null) {
                    // Load tenant type permissions and filter the available permissions
                    this.tenantTypePermissionService.getPermissionsByTenantType(this.currentTenantType).subscribe({
                        next: (tenantTypePerms: TenantTypePermission[]) => {
                            this.tenantTypePermissions = tenantTypePerms;
                            
                            // Filter available permissions to only show those allowed for this tenant type
                            const allowedPermissionNames = tenantTypePerms.map(ttp => ttp.permissionName);
                            const filteredPerms = allPermissions.filter(permission => 
                                allowedPermissionNames.includes(permission.name)
                            );
                            this.filteredPermissions.set(filteredPerms);
                        },
                        error: (error: any) => {
                            console.error('Error loading tenant type permissions:', error);
                            // If we can't load tenant type permissions, show all permissions
                            this.filteredPermissions.set(allPermissions);
                        }
                    });
                } else {
                    // For host or when tenant type is not determined, show all permissions
                    this.filteredPermissions.set(allPermissions);
                }
            },
            error: (error: any) => {
                console.error('Error loading all permissions:', error);
                this.availablePermissions.set([]);
                this.filteredPermissions.set([]);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.role = new RoleDto();
        this.submitted = false;
        this.roleDialog = true;
    }

    editRole(role: RoleDto) {
        this.role = RoleDto.fromJS(role);
        this.roleDialog = true;
    }

    openPermissionDialog(role: RoleDto) {
        this.role = RoleDto.fromJS(role);
        this.originalRolePermissions = (role.permissions || []).map((p) => RolePermission.fromJS({ roleId: role.id, permissionId: p.id }));
        
        // Use filtered permissions based on tenant type
        const permissionsToUse = this.currentTenantType !== null ? this.filteredPermissions() : this.availablePermissions();
        this.selectedPermissions = permissionsToUse.filter((permission) => 
            this.originalRolePermissions.some((rp) => rp.permissionId === permission.id)
        );
        this.permissionDialog = true;
    }

    hideDialog() {
        this.roleDialog = false;
        this.submitted = false;
    }

    saveRole() {
        this.submitted = true;
        if (this.role.name?.trim()) {
            if (this.role.id) {
                this.roleService.role_UpdateRole(this.role).subscribe({
                    next: (updatedRole) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Role Updated',
                            life: 3000
                        });
                        this.loadRoles();
                        this.roleDialog = false;
                        this.role = new RoleDto();
                        this.submitted = false;
                    },
                    error: (error: any) => {
                        console.error('Failed to update role:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update role',
                            life: 3000
                        });
                    }
                });
            } else {
                console.log('Creating new role:', this.role.name);
                this.roleService.role_CreateRole(RoleInput.fromJS({ name: this.role.name || '' })).subscribe({
                    next: (createdRole) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Role Created',
                            life: 3000
                        });
                        this.loadRoles();
                        this.roleDialog = false;
                        this.role = new RoleDto();
                        this.submitted = false;
                    },
                    error: (error: any) => {
                        console.error('Failed to create role:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create role',
                            life: 3000
                        });
                    }
                });
            }
        }
    }

    savePermissions() {
        // Permissions to add
        const permissionsToAdd = this.selectedPermissions.filter((selectedPerm) => !this.originalRolePermissions.some((originalPerm) => originalPerm.permissionId === selectedPerm.id));

        // Permissions to remove (API limitation)
        const permissionsToRemove = this.originalRolePermissions.filter((originalPerm) => !this.selectedPermissions.some((selectedPerm) => selectedPerm.id === originalPerm.permissionId));

        if (permissionsToRemove.length > 0) {
            console.warn('Cannot remove permissions due to API limitation. Permissions to remove:', permissionsToRemove);
        }

        // If there are no permissions to add, just close and show message
        if (permissionsToAdd.length === 0) {
            if (permissionsToRemove.length > 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Warning',
                    detail: 'Some permissions could not be removed due to API limitations.',
                    life: 5000
                });
            } else {
                this.messageService.add({
                    severity: 'info',
                    summary: 'No Changes',
                    detail: 'No permission changes to save',
                    life: 3000
                });
            }
            this.permissionDialog = false;
            return;
        }

        // Track completion of all permission assignments
        let completedCount = 0;
        const totalToAdd = permissionsToAdd.length;
        let hasError = false;

        permissionsToAdd.forEach((permission) => {
            this.rolePermissionService
                .rolePermission_CreateRolePermission(
                    CreateRolePermissionDto.fromJS({
                        roleId: this.role.id,
                        permissionId: permission.id
                    })
                )
                .subscribe({
                    next: () => {
                        completedCount++;
                        // When all permissions are added, reload and show success
                        if (completedCount === totalToAdd) {
                            this.loadRoles(); // Reload roles to reflect changes
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
                                    summary: 'Successful',
                                    detail: 'Permissions Updated',
                                    life: 3000
                                });
                            }

                            if (permissionsToRemove.length > 0) {
                                this.messageService.add({
                                    severity: 'warn',
                                    summary: 'Note',
                                    detail: 'Some permissions could not be removed due to API limitations.',
                                    life: 5000
                                });
                            }
                        }
                    },
                    error: (error) => {
                        hasError = true;
                        completedCount++;
                        console.error('Failed to assign permission:', error);
                        
                        // Still check if all are complete
                        if (completedCount === totalToAdd) {
                            this.loadRoles();
                            this.permissionDialog = false;
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to update some permissions',
                                life: 3000
                            });
                        }
                    }
                });
        });
    }

    hidePermissionDialog() {
        this.permissionDialog = false;
    }
}
