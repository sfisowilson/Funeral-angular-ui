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
import { MessageService, ConfirmationService } from 'primeng/api';
import { MemberDto, MemberServiceProxy, MemberStatus, CreateMemberDto } from '../../core/services/service-proxies';
import { DependentsComponent } from '../dependents/dependents.component';
import { BeneficiariesComponent } from '../beneficiaries/beneficiaries.component';

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
        DependentsComponent, 
        BeneficiariesComponent
    ],
    providers: [MessageService, ConfirmationService, MemberServiceProxy],
    templateUrl: './member-management.component.html',
    styleUrls: ['./member-management.component.scss']
})
export class MemberManagementComponent implements OnInit {
    members: MemberDto[] = [];
    selectedMembers: MemberDto[] = [];
    member: ExtendedMemberDto = new MemberDto();
    memberDialog: boolean = false;
    dependentsDialog: boolean = false;
    beneficiariesDialog: boolean = false;
    submitted: boolean = false;
    cols: any[] = [];

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
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadMembers();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'identificationNumber', header: 'ID Number' },
            { field: 'status', header: 'Status' }
        ];
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    loadMembers() {
        // Assuming a tenant context is available, for now, we'll fetch all members
        // In a real multi-tenant app, you'd pass a tenant ID to filter members
        this.memberService.member_GetAllMembers(undefined, undefined, undefined, undefined, undefined).subscribe((result) => {
            this.members = result;
        });
    }

    openNew() {
        this.member = new MemberDto(); // Reset to an empty MemberDto for new entry
        this.member.policyId = 'defaultPolicyId'; // TODO: Replace with actual policy ID
        // Initialize Phase 1 fields
        this.member.isReplacingExistingPolicy = false;
        // Initialize Phase 2 fields
        this.member.isForeigner = false;
        this.submitted = false;
        this.memberDialog = true;
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

    editMember(member: MemberDto) {
        this.member = MemberDto.fromJS(member); // Cast to ExtendedMemberDto
        this.memberDialog = true;
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

    manageBeneficiaries(member: MemberDto) {
        this.member = MemberDto.fromJS(member); // Create a new instance of MemberDto
        this.beneficiariesDialog = true;
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
    }

    saveMember() {
        this.submitted = true;

        if (this.member.name?.trim()) {
            if (this.member.id) {
                // Existing member
                this.memberService.member_UpdateMember(this.member.id, this.member).subscribe((result) => {
                    this.members[this.findIndexById(this.member.id!)] = result; // Use non-null assertion as ID exists for existing members
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
}
