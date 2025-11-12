import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { UserDto, UserServiceProxy, RoleServiceProxy, UserRoleServiceProxy, Role, UserRoleInputDto, UserRoleDto, RoleDto } from '../../core/services/service-proxies';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, TextareaModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, DropdownModule, MultiSelectModule],
    providers: [MessageService, ConfirmationService, UserServiceProxy, RoleServiceProxy, UserRoleServiceProxy],
    templateUrl: './users.component.html'
})
export class UsersComponent {
    userDialog: boolean = false;

    users = signal<UserDto[]>([]);
    roles = signal<RoleDto[]>([]);

    user!: UserDto;
    selectedRoles: RoleDto[] = [];
    originalUserRoles: UserRoleDto[] = [];

    selectedUsers!: UserDto[] | null;

    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportCSV() {
        this.dt.exportCSV();
    }

    cols: any[] = [];

    getUserRolesDisplay(user: UserDto): string {
        return user.userRoles?.map((ur) => ur.roleName).join(', ') || '';
    }

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private userService: UserServiceProxy,
        private roleService: RoleServiceProxy,
        private userRoleService: UserRoleServiceProxy
    ) {}

    ngOnInit() {
        this.loadUsers();
        this.loadRoles();
    }

    loadUsers() {
        this.userService.user_GetAllUsers(undefined, undefined, undefined, undefined, undefined).subscribe((users) => {
            this.users.set(users);
        });
    }

    loadRoles() {
        this.roleService.role_GetAllRoles().subscribe((roles) => {
            this.roles.set(roles);
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.user = new UserDto();
        this.selectedRoles = [];
        this.submitted = false;
        this.userDialog = true;
    }

    editUser(user: UserDto) {
        this.user = UserDto.fromJS(user);
        this.originalUserRoles = this.user.userRoles || [];
        this.selectedRoles = this.roles().filter((role) => this.originalUserRoles.some((ur) => ur.roleId === role.id));
        this.userDialog = true;
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected users?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.selectedUsers?.forEach((user) => {
                    this.userService.user_DeleteUser(user.id).subscribe(() => {
                        this.users.set(this.users().filter((val) => val.id !== user.id));
                    });
                });
                this.selectedUsers = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Users Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.userDialog = false;
        this.submitted = false;
    }

    deleteUser(user: UserDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + user.email + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.user_DeleteUser(user.id).subscribe(() => {
                    this.users.set(this.users().filter((val) => val.id !== user.id));
                    this.user = new UserDto();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'User Deleted',
                        life: 3000
                    });
                });
            }
        });
    }

    saveUser() {
        this.submitted = true;
        if (this.user.email?.trim() && this.user.firstName?.trim()) {
            if (this.user.id) {
                this.userService.user_UpdateUser(this.user).subscribe({
                    next: (updatedUser: UserDto) => {
                        // Roles to add
                        const rolesToAdd = this.selectedRoles.filter((selectedRole) => !this.originalUserRoles.some((originalRole) => originalRole.roleId === selectedRole.id));
                        rolesToAdd.forEach((role: RoleDto) => {
                            this.userRoleService.userRole_CreateUserRole(UserRoleInputDto.fromJS({ userId: updatedUser.id, roleId: role.id })).subscribe(() => {
                                // Handle success for individual role assignment if needed
                            });
                        });

                        // Roles to remove (API limitation)
                        const rolesToRemove = this.originalUserRoles.filter((originalRole) => !this.selectedRoles.some((selectedRole) => selectedRole.id === originalRole.roleId));
                        if (rolesToRemove.length > 0) {
                            console.warn('Cannot remove roles due to API limitation. Roles to remove:', rolesToRemove);
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Warning',
                                detail: 'Some roles could not be removed due to API limitations. Please contact support.',
                                life: 5000
                            });
                        }
                        this.loadUsers();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'User Updated',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update user',
                            life: 3000
                        });
                    }
                });
            } else {
                this.userService.user_CreateUser(this.user).subscribe({
                    next: (createdUser: UserDto) => {
                        const roleIds = this.selectedRoles.map((role: RoleDto) => role.id);
                        roleIds.forEach((roleId: string) => {
                            this.userRoleService.userRole_CreateUserRole(UserRoleInputDto.fromJS({ userId: createdUser.id, roleId: roleId })).subscribe(() => {
                                // Handle success for individual role assignment if needed
                            });
                        });
                        this.loadUsers();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'User Created',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create user',
                            life: 3000
                        });
                    }
                });
            }
            this.userDialog = false;
            this.user = new UserDto();
        }
    }
}
