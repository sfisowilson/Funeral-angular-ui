import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TimesheetServiceProxy, TimesheetEntryDto } from '../../core/services/service-proxies';

@Component({
    selector: 'app-timesheets',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, DialogModule, InputTextModule, DropdownModule, CalendarModule, InputNumberModule, InputTextarea, ToastModule, ConfirmDialogModule, TagModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './timesheets.component.html',
    styleUrl: './timesheets.component.scss'
})
export class TimesheetsComponent implements OnInit {
    timesheetEntries = signal<TimesheetEntryDto[]>([]);
    loading = signal(false);

    timesheetDialog = signal(false);
    submitted = signal(false);

    timesheetEntry: Partial<TimesheetEntryDto> = {};

    constructor(
        private timesheetService: TimesheetServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadTimesheetEntries();
    }

    loadTimesheetEntries() {
        this.loading.set(true);
        this.timesheetService.timesheet_GetMyTimesheetEntries(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => {
                this.timesheetEntries.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load timesheet entries' });
                this.loading.set(false);
            }
        });
    }

    openNew() {
        this.timesheetEntry = {};
        this.submitted.set(false);
        this.timesheetDialog.set(true);
    }

    editTimesheetEntry(entry: TimesheetEntryDto) {
        this.timesheetEntry = { ...entry };
        this.timesheetDialog.set(true);
    }

    deleteTimesheetEntry(entry: TimesheetEntryDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this timesheet entry?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.timesheetService.timesheet_DeleteTimesheetEntry(entry.id!).subscribe({
                    next: () => {
                        this.loadTimesheetEntries();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Timesheet Entry Deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete timesheet entry' })
                });
            }
        });
    }

    saveTimesheetEntry() {
        this.submitted.set(true);

        if (this.timesheetEntry.date && this.timesheetEntry.hoursWorked) {
            const entryDto = new TimesheetEntryDto();
            Object.assign(entryDto, this.timesheetEntry);

            if (this.timesheetEntry.id) {
                this.timesheetService.timesheet_UpdateTimesheetEntry(entryDto.id!, entryDto).subscribe({
                    next: () => {
                        this.loadTimesheetEntries();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Timesheet Entry Updated' });
                        this.timesheetDialog.set(false);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update timesheet entry' })
                });
            } else {
                this.timesheetService.timesheet_CreateTimesheetEntry(entryDto).subscribe({
                    next: () => {
                        this.loadTimesheetEntries();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Timesheet Entry Created' });
                        this.timesheetDialog.set(false);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create timesheet entry' })
                });
            }
        }
    }

    hideDialog() {
        this.timesheetDialog.set(false);
        this.submitted.set(false);
    }

    calculateHours(startTime: Date, endTime: Date): number {
        if (!startTime || !endTime) return 0;
        const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
        return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
    }

    get timesheetDialogVisible() {
        return this.timesheetDialog();
    }

    set timesheetDialogVisible(value: boolean) {
        this.timesheetDialog.set(value);
    }
}
