import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { UserDto, UserServiceProxy } from '../../core/services/service-proxies';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    bio?: string;
    status?: string;
    dateAdded?: Date;
}

interface TeamTemplate {
    name: string;
    description: string;
    members: TeamMember[];
}

@Component({
    selector: 'app-team-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, TableModule, DialogModule, ConfirmDialogModule, ToastModule, MultiSelectModule, DropdownModule, TagModule, FileUploadModule, RadioButtonModule, TooltipModule],
    providers: [MessageService, ConfirmationService, UserServiceProxy],
    templateUrl: './team-editor.component.html',
    styleUrls: ['./team-editor.component.scss']
})
export class TeamEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;

    teamMembers: TeamMember[] = [];
    availableUsers: UserDto[] = [];
    selectedUsers: UserDto[] = [];

    // Widget properties
    widgetTitle: string = 'Team Management';
    widgetDescription: string = 'Manage your team members and their roles';

    // Dialog states
    displayAddMemberDialog: boolean = false;
    displayUserDialog: boolean = false;
    displayCreateDialog: boolean = false;
    displayImportDialog: boolean = false;

    // Filtering and search
    searchTerm: string = '';
    roleFilterOptions: string[] = ['All', 'Admin', 'Manager', 'Employee', 'Intern'];
    selectedRoleFilter: string = 'All';
    filteredTeamMembers: TeamMember[] = [];

    // Import options
    importType: string = 'csv';
    uploadedFiles: any[] = [];

    // New member form
    newMember: TeamMember = { id: '', name: '', email: '', role: '' };

    // Available users for adding
    userSearchTerm: string = '';
    filteredAvailableUsers: UserDto[] = [];
    defaultRole: string = '';

    // Template options
    teamTemplates: TeamTemplate[] = [
        { name: 'Development Team', description: 'Standard development team structure', members: [] },
        { name: 'Marketing Team', description: 'Marketing department team', members: [] },
        { name: 'Sales Team', description: 'Sales department team', members: [] }
    ];
    selectedTemplate: TeamTemplate | null = null;
    roles: string[] = ['Admin', 'Manager', 'Employee', 'Intern'];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private userService: UserServiceProxy
    ) {}

    ngOnInit(): void {
        console.log('🏢 Team Editor Component initialized');
        console.log('Config:', this.config);

        if (this.config.settings.teamMembers) {
            this.teamMembers = [...this.config.settings.teamMembers];
            console.log('Loaded existing team members:', this.teamMembers);
        } else {
            console.log('No existing team members found');
        }

        this.filteredTeamMembers = [...this.teamMembers];
        this.filteredAvailableUsers = [...this.availableUsers];
        this.loadUsers();
    }

    // Team Statistics Methods
    getTotalMembers(): number {
        return this.teamMembers.length;
    }

    getUniqueRoles(): number {
        const uniqueRoles = new Set(this.teamMembers.map((member) => member.role).filter((role) => role && role.trim() !== ''));
        return uniqueRoles.size;
    }

    getActiveMembers(): number {
        return this.teamMembers.filter((member) => member.status !== 'inactive').length;
    }

    getRecentlyAdded(): number {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return this.teamMembers.filter((member) => {
            if (member.dateAdded) {
                const addedDate = new Date(member.dateAdded);
                return addedDate >= oneWeekAgo;
            }
            return false;
        }).length;
    }

    // Filter and Search Methods
    filterMembers(): void {
        let filtered = [...this.teamMembers];

        // Apply search filter
        if (this.searchTerm && this.searchTerm.trim() !== '') {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(
                (member) => member.name.toLowerCase().includes(term) || member.email.toLowerCase().includes(term) || (member.role && member.role.toLowerCase().includes(term)) || (member.department && member.department.toLowerCase().includes(term))
            );
        }

        // Apply role filter
        if (this.selectedRoleFilter && this.selectedRoleFilter !== 'All') {
            filtered = filtered.filter((member) => member.role === this.selectedRoleFilter);
        }

        this.filteredTeamMembers = filtered;
    }

    onSearchChange(): void {
        this.filterMembers();
    }

    onRoleFilterChange(): void {
        this.filterMembers();
    }

    // Dialog Methods
    openUserDialog(): void {
        this.displayUserDialog = true;
        this.selectedUsers = [];
    }

    openCreateMemberDialog(): void {
        this.displayCreateDialog = true;
        this.newMember = { id: '', name: '', email: '', role: '' };
    }

    openImportDialog(): void {
        this.displayImportDialog = true;
        this.uploadedFiles = [];
    }

    // User Management Methods
    loadUsers(): void {
        console.log('🔄 Loading users for team selection...');

        this.userService.user_GetAllUsers(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (users) => {
                console.log('✅ Users loaded successfully:', users);
                this.availableUsers = users;
                this.filteredAvailableUsers = [...users];
            },
            error: (error) => {
                console.error('❌ Error loading users:', error);
                console.error('Error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    url: error.url
                });
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load users. Please check your authentication.'
                });
            }
        });
    }

    addSelectedUsers(): void {
        this.selectedUsers.forEach((user) => {
            const newMember: TeamMember = {
                id: user.id,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                role: '',
                status: 'active',
                dateAdded: new Date()
            };
            this.teamMembers.push(newMember);
        });
        this.saveSettings();
        this.filterMembers();
        this.selectedUsers = [];
        this.displayUserDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${this.selectedUsers.length} team member(s) added successfully`
        });
    }

    createNewMember(): void {
        if (this.newMember.name && this.newMember.email && this.newMember.role) {
            const member: TeamMember = {
                id: Date.now().toString(),
                name: this.newMember.name,
                email: this.newMember.email,
                role: this.newMember.role,
                department: this.newMember.department,
                bio: this.newMember.bio,
                status: 'active',
                dateAdded: new Date()
            };
            this.teamMembers.push(member);
            this.saveSettings();
            this.filterMembers();
            this.displayCreateDialog = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'New team member created successfully'
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields'
            });
        }
    }

    // Member Actions
    editMember(member: TeamMember): void {
        // Implementation for editing member
        console.log('Edit member:', member);
    }

    viewMember(member: TeamMember): void {
        // Implementation for viewing member details
        console.log('View member:', member);
    }

    deleteMember(member: TeamMember): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to remove ${member.name} from the team?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const index = this.teamMembers.findIndex((m) => m.id === member.id);
                if (index > -1) {
                    this.teamMembers.splice(index, 1);
                    this.saveSettings();
                    this.filterMembers();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Team member removed successfully'
                    });
                }
            }
        });
    }

    // Utility Methods
    getAvatarColor(name: string): string {
        const colors = [
            'var(--avatar-1, #FF6B6B)',
            'var(--avatar-2, #4ECDC4)',
            'var(--avatar-3, #45B7D1)',
            'var(--avatar-4, #96CEB4)',
            'var(--avatar-5, #FFEAA7)',
            'var(--avatar-6, #DDA0DD)',
            'var(--avatar-7, #98D8C8)'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    getStatusSeverity(status: string | undefined): string {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            case 'pending':
                return 'warning';
            default:
                return 'info';
        }
    }

    formatDate(date: Date | undefined): string {
        if (!date) return 'N/A';
        return date.toLocaleDateString();
    }

    // File Import Methods
    onFileSelect(event: any): void {
        this.uploadedFiles = event.files;
    }

    importTeamData(): void {
        if (this.uploadedFiles.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'No File Selected',
                detail: 'Please select a file to import'
            });
            return;
        }

        const file = this.uploadedFiles[0];
        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                let importedData: any[] = [];

                if (this.importType === 'csv') {
                    // CSV parsing logic would go here
                    const csvData = e.target.result;
                    console.log('CSV data:', csvData);
                    // For now, show success message
                    this.messageService.add({
                        severity: 'info',
                        summary: 'CSV Import',
                        detail: 'CSV import functionality to be implemented'
                    });
                } else if (this.importType === 'json') {
                    importedData = JSON.parse(e.target.result);
                    // Process JSON data
                    importedData.forEach((item: any) => {
                        const member: TeamMember = {
                            id: item.id || Date.now().toString(),
                            name: item.name || '',
                            email: item.email || '',
                            role: item.role || '',
                            department: item.department,
                            bio: item.bio,
                            status: item.status || 'active',
                            dateAdded: item.dateAdded ? new Date(item.dateAdded) : new Date()
                        };
                        this.teamMembers.push(member);
                    });

                    this.saveSettings();
                    this.filterMembers();
                    this.displayImportDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Import Successful',
                        detail: `${importedData.length} team members imported successfully`
                    });
                }
            } catch (error) {
                console.error('Import error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Import Failed',
                    detail: 'Failed to parse the selected file'
                });
            }
        };

        reader.readAsText(file);
    }

    loadTemplate(): void {
        if (this.selectedTemplate) {
            this.selectedTemplate.members.forEach((templateMember) => {
                const member: TeamMember = {
                    id: Date.now().toString() + Math.random(),
                    name: templateMember.name,
                    email: templateMember.email,
                    role: templateMember.role,
                    department: templateMember.department,
                    bio: templateMember.bio,
                    status: 'active',
                    dateAdded: new Date()
                };
                this.teamMembers.push(member);
            });

            this.saveSettings();
            this.filterMembers();
            this.displayImportDialog = false;
            this.messageService.add({
                severity: 'success',
                summary: 'Template Loaded',
                detail: `${this.selectedTemplate.name} template applied successfully`
            });
        }
    }

    saveSettings(): void {
        this.config.settings.teamMembers = this.teamMembers;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Team settings updated' });
    }

    openAddMemberDialog(): void {
        this.displayAddMemberDialog = true;
    }

    // Missing dialog close methods
    closeAddMemberDialog(): void {
        this.displayUserDialog = false;
        this.selectedUsers = [];
    }

    closeCreateMemberDialog(): void {
        this.displayCreateDialog = false;
        this.newMember = { id: '', name: '', email: '', role: '' };
    }

    closeImportDialog(): void {
        this.displayImportDialog = false;
        this.uploadedFiles = [];
    }

    // User filtering for available users dialog
    filterAvailableUsers(): void {
        if (this.userSearchTerm && this.userSearchTerm.trim() !== '') {
            const term = this.userSearchTerm.toLowerCase();
            this.filteredAvailableUsers = this.availableUsers.filter((user) => user.firstName?.toLowerCase().includes(term) || user.lastName?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term));
        } else {
            this.filteredAvailableUsers = [...this.availableUsers];
        }
    }

    // Validation methods
    isNewMemberValid(): boolean {
        return !!(this.newMember.name && this.newMember.email && this.newMember.role);
    }

    canImport(): boolean {
        if (this.importType === 'template') {
            return !!this.selectedTemplate;
        }
        return this.uploadedFiles.length > 0;
    }

    // Template download functionality
    downloadTemplate(): void {
        const template = {
            teamMembers: [
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    role: 'Manager',
                    department: 'Development',
                    bio: 'Team lead with 5+ years experience',
                    status: 'active'
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    email: 'jane.smith@example.com',
                    role: 'Developer',
                    department: 'Development',
                    bio: 'Full-stack developer',
                    status: 'active'
                }
            ]
        };

        const dataStr = JSON.stringify(template, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'team-template.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.messageService.add({
            severity: 'success',
            summary: 'Template Downloaded',
            detail: 'Team template has been downloaded successfully'
        });
    }
}
