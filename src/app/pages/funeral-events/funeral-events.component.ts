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
import { FuneralEventServiceProxy, FuneralEventDto, FuneralEventStatus, ClaimServiceProxy } from '../../core/services/service-proxies';
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

    funeralEvent: Partial<FuneralEventDto> = {};

    statuses = [
        { label: 'Status 0', value: FuneralEventStatus._0 },
        { label: 'Status 1', value: FuneralEventStatus._1 },
        { label: 'Status 2', value: FuneralEventStatus._2 }
    ];

    constructor(
        private funeralEventService: FuneralEventServiceProxy,
        private claimService: ClaimServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadFuneralEvents();
        this.loadClaims();
    }

    loadFuneralEvents() {
        this.loading.set(true);
        this.funeralEventService.funeralEvent_GetAllFuneralEvents(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => {
                this.funeralEvents.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load funeral events' });
                this.loading.set(false);
            }
        });
    }

    loadClaims() {
        this.claimService.claim_GetAllClaims(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => this.claims.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load claims' })
        });
    }

    openNew() {
        this.funeralEvent = { status: FuneralEventStatus._0 };
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
                this.funeralEventService.funeralEvent_DeleteFuneralEvent(event.id!).subscribe({
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

        if (this.funeralEvent.claimId && this.funeralEvent.eventDate) {
            const eventDto = new FuneralEventDto();
            eventDto.claimId = this.funeralEvent.claimId;
            eventDto.eventDate = this.funeralEvent.eventDate;
            eventDto.location = this.funeralEvent.location;
            eventDto.notes = this.funeralEvent.notes;
            eventDto.status = this.funeralEvent.status || FuneralEventStatus._0;

            if (this.funeralEvent.id) {
                eventDto.id = this.funeralEvent.id;
                this.funeralEventService.funeralEvent_UpdateFuneralEvent(eventDto.id, eventDto).subscribe({
                    next: () => {
                        this.loadFuneralEvents();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Funeral Event Updated' });
                        this.eventDialog.set(false);
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update funeral event' })
                });
            } else {
                this.funeralEventService.funeralEvent_CreateFuneralEvent(eventDto).subscribe({
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

    getSeverity(status: FuneralEventStatus): string {
        switch (status) {
            case FuneralEventStatus._0:
                return 'info';
            case FuneralEventStatus._1:
                return 'warning';
            case FuneralEventStatus._2:
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
