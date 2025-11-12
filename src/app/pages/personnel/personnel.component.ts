import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PersonnelServiceProxy, FuneralEventDto } from '../../core/services/service-proxies';

interface PersonnelMember {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
}

@Component({
    selector: 'app-personnel',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, DropdownModule, ToastModule, ConfirmDialogModule, TagModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './personnel.component.html',
    styleUrl: './personnel.component.scss'
})
export class PersonnelComponent implements OnInit {
    personnel = signal<PersonnelMember[]>([]);
    schedule = signal<FuneralEventDto[]>([]);
    loading = signal(false);

    personnelDialog = signal(false);
    scheduleDialog = signal(false);
    submitted = signal(false);

    personnelMember: Partial<PersonnelMember> = {};

    roles = [
        { label: 'Driver', value: 'Driver' },
        { label: 'Decorator', value: 'Decorator' },
        { label: 'Director', value: 'Director' },
        { label: 'Assistant', value: 'Assistant' }
    ];

    constructor(
        private personnelService: PersonnelServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadPersonnel();
    }

    loadPersonnel() {
        this.loading.set(true);
        // For now, use mock data since the API doesn't have full personnel CRUD
        this.personnel.set([
            {
                id: '1',
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@funeral.com',
                phone: '555-0101',
                role: 'Driver',
                isActive: true
            },
            {
                id: '2',
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah.johnson@funeral.com',
                phone: '555-0102',
                role: 'Decorator',
                isActive: true
            }
        ]);
        this.loading.set(false);
    }

    viewSchedule(person: PersonnelMember) {
        this.personnelService.personnel_GetMySchedule(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => {
                this.schedule.set(data);
                this.scheduleDialog.set(true);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load schedule' })
        });
    }

    openNew() {
        this.personnelMember = { isActive: true, role: 'Assistant' };
        this.submitted.set(false);
        this.personnelDialog.set(true);
    }

    editPersonnel(person: PersonnelMember) {
        this.personnelMember = { ...person };
        this.personnelDialog.set(true);
    }

    deletePersonnel(person: PersonnelMember) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this personnel member?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const updatedPersonnel = this.personnel().filter((p) => p.id !== person.id);
                this.personnel.set(updatedPersonnel);
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Personnel Deleted' });
            }
        });
    }

    savePersonnel() {
        this.submitted.set(true);

        if (this.personnelMember.firstName && this.personnelMember.lastName && this.personnelMember.email) {
            if (this.personnelMember.id) {
                // Update existing
                const updatedPersonnel = this.personnel().map((p) => (p.id === this.personnelMember.id ? { ...(this.personnelMember as PersonnelMember) } : p));
                this.personnel.set(updatedPersonnel);
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Personnel Updated' });
            } else {
                // Create new
                const newPerson = {
                    ...(this.personnelMember as PersonnelMember),
                    id: Date.now().toString()
                };
                this.personnel.set([...this.personnel(), newPerson]);
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Personnel Created' });
            }
            this.personnelDialog.set(false);
        }
    }

    hideDialog() {
        this.personnelDialog.set(false);
        this.submitted.set(false);
    }

    hideScheduleDialog() {
        this.scheduleDialog.set(false);
    }

    get personnelDialogVisible() {
        return this.personnelDialog();
    }

    set personnelDialogVisible(value: boolean) {
        this.personnelDialog.set(value);
    }

    get scheduleDialogVisible() {
        return this.scheduleDialog();
    }

    set scheduleDialogVisible(value: boolean) {
        this.scheduleDialog.set(value);
    }
}
