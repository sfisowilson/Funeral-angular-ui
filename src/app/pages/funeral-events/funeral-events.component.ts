import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FuneralEventsService } from '../../core/services/generated/funeral-events/funeral-events.service';
import { ClaimsService } from '../../core/services/generated/claims/claims.service';
import { FuneralEventDto } from '../../core/models';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-funeral-events',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule, InputTextModule, DropdownModule, CalendarModule, InputTextarea, ToastModule, ConfirmDialogModule, TagModule, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './funeral-events.component.html',
    styleUrl: './funeral-events.component.scss'
})
export class FuneralEventsComponent implements OnInit {
    funeralEvents = signal<FuneralEventDto[]>([]);
    claims = signal<any[]>([]);
    loading = signal(false);

    eventDialog = signal(false);
    submitted = signal(false);

    funeralEvent: Partial<FuneralEventDto> & { claimId?: string; notes?: string; status?: number } = {};

    statuses = [
        { label: 'Status 0', value: 0 },
        { label: 'Status 1', value: 1 },
        { label: 'Status 2', value: 2 }
    ];

    constructor(
        private funeralEventService: FuneralEventsService,
        private claimService: ClaimsService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadFuneralEvents();
        this.loadClaims();
    }

    loadFuneralEvents() {
        this.loading.set(true);
        this.funeralEventService.getApiFuneralEventFuneralEventGetAllFuneralEvents<FuneralEventDto[]>().subscribe({
            next: (data: any) => {
                this.funeralEvents.set(data || []);
                this.loading.set(false);
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load funeral events' });
                this.loading.set(false);
            }
        });
    }

    loadClaims() {
        this.claimService.getApiClaimClaimGetAllClaims<any[]>().subscribe({
            next: (data) => this.claims.set(data || []),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load claims' })
        });
    }

    openNew() {
        this.funeralEvent = { status: 0 };
        this.submitted.set(false);
        this.eventDialog.set(true);
    }

    editEvent(event: FuneralEventDto) {
        this.funeralEvent = { ...event };
        this.eventDialog.set(true);
    }

    deleteEvent(event: FuneralEventDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this funeral event?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.funeralEventService.deleteApiFuneralEventFuneralEventDeleteFuneralEventId(event.id!).subscribe({
                    next: () => {
                        this.loadFuneralEvents();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Funeral Event Deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete funeral event' })
                });
            }
        });
    }

    saveEvent() {
        this.submitted.set(true);

        if (this.funeralEvent.eventName && this.funeralEvent.eventDate) {
            const eventDto: FuneralEventDto = {
                id: this.funeralEvent.id || '',
                eventName: this.funeralEvent.eventName,
                eventDate: this.funeralEvent.eventDate,
                location: this.funeralEvent.location || '',
                description: this.funeralEvent.description || ''
            };

            if (this.funeralEvent.id) {
                this.funeralEventService.putApiFuneralEventFuneralEventUpdateFuneralEventId(eventDto.id, eventDto).subscribe({
                    next: () => {
                        this.loadFuneralEvents();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Funeral Event Updated' });
                        this.eventDialog.set(false);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update funeral event' })
                });
            } else {
                this.funeralEventService.postApiFuneralEventFuneralEventCreateFuneralEvent(eventDto).subscribe({
                    next: () => {
                        this.loadFuneralEvents();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Funeral Event Created' });
                        this.eventDialog.set(false);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create funeral event' })
                });
            }
        }
    }

    hideDialog() {
        this.eventDialog.set(false);
        this.submitted.set(false);
    }

    getSeverity(status: number): string {
        switch (status) {
            case 0:
                return 'info';
            case 1:
                return 'warning';
            case 2:
                return 'success';
            default:
                return 'secondary';
        }
    }

    getClaimInfo(claimId: string): string {
        const claim = this.claims().find((c) => c.id === claimId);
        return claim ? `Claim #${claim.id}` : 'Unknown Claim';
    }

    get eventDialogVisible() {
        return this.eventDialog();
    }

    set eventDialogVisible(value: boolean) {
        this.eventDialog.set(value);
    }
}
