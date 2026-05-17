import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextarea } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MemberDto, MemberServiceProxy, MemberStatus, CreateMemberDto, FileMetadataDto, FileUploadServiceProxy, CustomPagesServiceProxy, AuthServiceProxy, ForgotPasswordRequest, PageListItemDto } from '../../core/services/service-proxies';
import { unwrap } from '../../core/services/response-unwrapper';
import { first } from 'rxjs/operators';
import { DependentsComponent } from '../dependents/dependents.component';

interface ExtendedMemberDto extends MemberDto {
    policyId?: string;
}

@Component({
    selector: 'app-member-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        TagModule,
        DropdownModule,
        CalendarModule,
        CheckboxModule,
        InputMaskModule,
        InputTextarea,
        TooltipModule,
        TabViewModule,
        ProgressSpinnerModule,
        DependentsComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './member-management.component.html',
    styleUrls: ['./member-management.component.scss']
})
export class MemberManagementComponent implements OnInit {
    members: MemberDto[] = [];
    selectedMembers: MemberDto[] = [];
    member: ExtendedMemberDto = new MemberDto();
    memberDialog: boolean = false;
    dependentsDialog: boolean = false;
    submitted: boolean = false;
    cols: any[] = [];

    // Mini new-member dialog
    newMemberDialog = false;
    newMemberEmail = '';
    newMemberFirstName = '';
    newMemberSurname = '';
    creatingNewMember = false;

    // Documents tab state
    adminDocuments: FileMetadataDto[] = [];
    loadingDocuments = false;
    documentName = '';
    documentFile: File | null = null;
    uploadingDocument = false;

    // Phase 1: Dropdown options
    titleOptions = [
        { label: 'Mr', value: 'Mr' },
        { label: 'Mrs', value: 'Mrs' },
        { label: 'Miss', value: 'Miss' },
        { label: 'Ms', value: 'Ms' },
        { label: 'Dr', value: 'Dr' },
        { label: 'Prof', value: 'Prof' }
    ];

    sourceOfIncomeOptions = [
        { label: 'Salary', value: 1 },
        { label: 'Pension', value: 2 },
        { label: 'Government Grant', value: 3 },
        { label: 'Other', value: 4 }
    ];

    provinceOptions = [
        { label: 'Eastern Cape', value: 1 },
        { label: 'Free State', value: 2 },
        { label: 'Gauteng', value: 3 },
        { label: 'KwaZulu-Natal', value: 4 },
        { label: 'Limpopo', value: 5 },
        { label: 'Mpumalanga', value: 6 },
        { label: 'North West', value: 7 },
        { label: 'Northern Cape', value: 8 },
        { label: 'Western Cape', value: 9 }
    ];

    constructor(
        private memberService: MemberServiceProxy,
        private fileUploadService: FileUploadServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private customPagesService: CustomPagesServiceProxy,
        private authService: AuthServiceProxy
    ) {}

    ngOnInit() {
        this.loadMembers();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'identificationNumber', header: 'ID Number' },
            { field: 'agentName', header: 'Agent' },
            { field: 'status', header: 'Status' }
        ];
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    loadMembers() {
        // Assuming a tenant context is available, for now, we'll fetch all members
        // In a real multi-tenant app, you'd pass a tenant ID to filter members
        this.memberService
            .member_GetAllMembers(undefined, undefined, undefined, undefined, undefined)
            .pipe(unwrap<MemberDto[]>())
            .subscribe((result) => {
                this.members = result;
            });
    }

    openNew() {
        this.newMemberEmail = '';
        this.newMemberFirstName = '';
        this.newMemberSurname = '';
        this.newMemberDialog = true;
    }

    deleteSelectedMembers() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected members?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedMembers.map((m) => m.id);
                ids.forEach((id) => {
                    this.memberService.member_DeleteMember(id).subscribe(() => {
                        this.members = this.members.filter((val) => val.id !== id);
                    });
                });
                this.selectedMembers = [];
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Members Deleted', life: 3000 });
            }
        });
    }

    createNewMemberAndFillOnboarding(): void {
        if (!this.newMemberEmail && !this.newMemberFirstName && !this.newMemberSurname) {
            this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please enter at least an email or name.' });
            return;
        }
        this.creatingNewMember = true;
        const newId = crypto.randomUUID();
        const dto = new CreateMemberDto();
        dto.id = newId;
        dto.email = this.newMemberEmail || undefined;
        dto.firstNames = this.newMemberFirstName || undefined;
        dto.surname = this.newMemberSurname || undefined;
        dto.name = [this.newMemberFirstName, this.newMemberSurname].filter(Boolean).join(' ') || undefined;
        this.memberService.member_Create(dto).pipe(first()).subscribe({
            next: () => {
                this.creatingNewMember = false;
                this.newMemberDialog = false;
                this.loadMembers();
                this.navigateToOnboardingForMember(newId);
            },
            error: (err) => {
                this.creatingNewMember = false;
                console.error('Failed to create member:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create member. Please try again.' });
            }
        });
    }

    private navigateToOnboardingForMember(memberId: string): void {
        this.customPagesService.all().pipe(first()).subscribe({
            next: (resp) => {
                const pages: PageListItemDto[] = (resp as any)?.result || [];
                const onboardingPage = pages.find((p) => p.isActive && p.isOnboardingPage);
                if (!onboardingPage?.slug) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'No Onboarding Page',
                        detail: 'No page has been marked as the onboarding page. Please set one in Page Management.'
                    });
                    return;
                }
                this.router.navigate(['/', onboardingPage.slug], {
                    queryParams: { adminMemberId: memberId }
                });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pages. Please try again.' });
            }
        });
    }

    fillOnboarding(member: MemberDto): void {
        this.navigateToOnboardingForMember(member.id as string);
    }

    // kept for any future use — page picker is removed

    resendInvite(member: MemberDto): void {
        if (!member.email) {
            return;
        }
        const req = new ForgotPasswordRequest({ email: member.email });
        this.authService.auth_ForgotPassword(req).pipe(first()).subscribe({
            next: () => this.messageService.add({
                severity: 'success',
                summary: 'Invite Sent',
                detail: `Welcome email resent to ${member.email}`
            }),
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Failed',
                detail: 'Could not resend invite.'
            })
        });
    }

    editMember(member: MemberDto) {
        this.member = MemberDto.fromJS(member); // Cast to ExtendedMemberDto
        this.adminDocuments = [];
        this.documentName = '';
        this.documentFile = null;
        this.memberDialog = true;
        if (member.id) {
            this.loadAdminDocuments(member.id);
        }
    }

    deleteMember(member: MemberDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + member.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.memberService.member_DeleteMember(member.id).subscribe(() => {
                    this.members = this.members.filter((val) => val.id !== member.id);
                    this.member = new MemberDto();
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Member Deleted', life: 3000 });
                });
            }
        });
    }

    manageDependents(member: MemberDto) {
        this.member = MemberDto.fromJS(member); // Create a new instance of MemberDto
        this.dependentsDialog = true;
    }

    viewOnboarding(member: MemberDto) {
        // Navigate to onboarding page in view mode with the member's ID (within admin layout)
        this.router.navigate(['/admin/member-onboarding'], {
            queryParams: {
                view: 'true',
                memberId: member.id
            }
        });
    }

    hideDialog() {
        this.memberDialog = false;
        this.submitted = false;
        this.adminDocuments = [];
        this.documentName = '';
        this.documentFile = null;
    }

    saveMember() {
        this.submitted = true;

        if (this.member.name?.trim()) {
            if (this.member.id) {
                // Existing member
                this.memberService.member_UpdateMember(this.member.id, this.member).subscribe((response) => {
                    this.members[this.findIndexById(this.member.id!)] = response?.result; // Use non-null assertion as ID exists for existing members
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Member Updated', life: 3000 });
                    this.members = [...this.members];
                    this.memberDialog = false;
                    this.member = new MemberDto();
                });
            } else {
                // New member
                // Ensure policyId is set before creating CreateMemberDto
                if (!this.member.policyId) {
                    this.member.policyId = 'defaultPolicyId'; // Assign a default or handle as appropriate
                }
                const createMemberDto = CreateMemberDto.fromJS(this.member); // Convert MemberDto to CreateMemberDto
                this.memberService.member_Create(createMemberDto).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Member Created', life: 3000 });
                    this.loadMembers();
                    this.memberDialog = false;
                    this.member = new MemberDto();
                });
            }
        }
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    getMemberStatusText(status: MemberStatus): string {
        switch (status) {
            case MemberStatus._0:
                return 'Pending';
            case MemberStatus._1:
                return 'Active';
            case MemberStatus._2:
                return 'Inactive';
            case MemberStatus._3:
                return 'Deceased';
            default:
                return 'Unknown';
        }
    }

    getMemberStatusSeverity(status: MemberStatus): string {
        switch (status) {
            case MemberStatus._0:
                return 'warning';
            case MemberStatus._1:
                return 'success';
            case MemberStatus._2:
                return 'danger';
            case MemberStatus._3:
                return 'info';
            default:
                return 'primary';
        }
    }

    loadAdminDocuments(memberId: string): void {
        this.loadingDocuments = true;
        this.fileUploadService.file_GetAdminDocumentsByMemberId(memberId)
            .pipe(unwrap<FileMetadataDto[]>())
            .subscribe({
                next: (docs) => {
                    this.adminDocuments = docs || [];
                    this.loadingDocuments = false;
                },
                error: () => {
                    this.loadingDocuments = false;
                }
            });
    }

    onDocumentFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.documentFile = input.files?.[0] ?? null;
    }

    uploadDocument(): void {
        if (!this.documentFile || !this.documentName.trim() || !this.member.id) return;

        this.uploadingDocument = true;
        const fileParam = { data: this.documentFile, fileName: this.documentFile.name };

        this.fileUploadService.file_AdminAttachDocument(this.member.id, this.documentName.trim(), fileParam)
            .pipe(unwrap<FileMetadataDto>())
            .subscribe({
                next: (doc) => {
                    this.adminDocuments = [doc, ...this.adminDocuments];
                    this.documentName = '';
                    this.documentFile = null;
                    const fileInput = document.getElementById('docFileInput') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                    this.uploadingDocument = false;
                    this.messageService.add({ severity: 'success', summary: 'Document Attached', detail: 'Document uploaded and member notified by email.', life: 4000 });
                },
                error: () => {
                    this.uploadingDocument = false;
                    this.messageService.add({ severity: 'error', summary: 'Upload Failed', detail: 'Could not attach document. Please try again.', life: 4000 });
                }
            });
    }

    deleteDocument(doc: FileMetadataDto): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${doc.displayName || doc.fileName}"?`,
            header: 'Delete Document',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.fileUploadService.file_DeleteFile(doc.id)
                    .subscribe({
                        next: () => {
                            this.adminDocuments = this.adminDocuments.filter(d => d.id !== doc.id);
                            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Document removed.', life: 3000 });
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not delete document.', life: 3000 });
                        }
                    });
            }
        });
    }

    downloadDocument(doc: FileMetadataDto): void {
        const url = `/api/FileUpload/File_DownloadFile/${doc.id}`;
        window.open(url, '_blank');
    }
}
