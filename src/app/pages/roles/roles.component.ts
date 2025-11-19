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
import { RoleService } from '../../core/services/generated/role/role.service';
import { PermissionService } from '../../core/services/generated/permission/permission.service';
import { RoleDto, PermissionDto } from '../../core/models';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, MultiSelectModule],
    providers: [MessageService, ConfirmationService, RoleService, PermissionService],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent {
    roleDialog: boolean = false;

    roles = signal<RoleDto[]>([]);

    role!: RoleDto;

    selectedRoles!: RoleDto[] | null;

    permissionDialog: boolean = false;
    availablePermissions = signal<PermissionDto[]>([]);
    selectedPermissions: PermissionDto[] = [];
    // originalRolePermissions removed - using simplified permission management
    originalPermissionIds: string[] = [];

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private roleService: RoleService,
        private permissionService: PermissionService
    ) {}

    ngOnInit() {
        this.loadRoles();
        this.loadPermissions();
    }

    loadRoles() {
        this.roleService.getApiRoleRoleGetAllRoles<RoleDto[]>().subscribe((roles: any) => {
            this.roles.set(roles);
        });
    }

    loadPermissions() {
        this.permissionService.getApiPermissionPermissionGetAllPermissions<PermissionDto[]>().subscribe((permissions: any) => {
            this.availablePermissions.set(permissions);
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.role = {} as RoleDto;
        this.submitted = false;
        this.roleDialog = true;
    }

    editRole(role: RoleDto) {
        this.role = { ...role };
        this.roleDialog = true;
    }

    openPermissionDialog(role: RoleDto) {
        this.role = { ...role };
        this.originalPermissionIds = (role.permissions || []).map((p: any) => p.id || p);
        this.selectedPermissions = this.availablePermissions().filter((permission) => this.originalPermissionIds.includes(permission.id || ''));
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
                this.roleService.postApiRoleRoleUpdateRole(this.role).subscribe({
                    next: (updatedRole) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Role Updated',
                            life: 3000
                        });
                        this.loadRoles();
                        this.roleDialog = false;
                        this.role = {} as RoleDto;
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
                this.roleService.postApiRoleRoleCreateRole({ name: this.role.name || '' } as any).subscribe({
                    next: (createdRole) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Role Created',
                            life: 3000
                        });
                        this.loadRoles();
                        this.roleDialog = false;
                        this.role = {} as RoleDto;
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
        // Update role with selected permission IDs
        const updatedRole = {
            ...this.role,
            permissions: this.selectedPermissions.map((p) => p.id)
        };

        this.roleService.postApiRoleRoleUpdateRole(updatedRole as any).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Permissions Updated',
                    life: 3000
                });
                this.loadRoles();
                this.permissionDialog = false;
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update permissions',
                    life: 3000
                });
                console.error('Failed to update permissions:', error);
            }
        });
    }

    hidePermissionDialog() {
        this.permissionDialog = false;
    }
}
