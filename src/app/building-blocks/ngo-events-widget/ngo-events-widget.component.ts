import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-events-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, TagModule],
    template: `
        <div class="ngo-events-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title || 'Upcoming Events' }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div *ngIf="loading" class="text-center p-8">
                    <p class="text-muted">Loading events...</p>
                </div>

                <div *ngIf="!loading && events.length === 0" class="text-center p-8">
                    <p class="text-muted">No upcoming events at this time.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div *ngFor="let event of events" class="event-card rounded-lg overflow-hidden shadow-lg" [style.background-color]="config.cardBackgroundColor">
                        <div *ngIf="event.imageUrl" class="event-image relative">
                            <img [src]="event.imageUrl" [alt]="event.title" class="w-full h-48 object-cover" />
                            <span *ngIf="event.status" class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold" 
                                [style.background-color]="getStatusColor(event.status)" 
                                [style.color]="config.statusTextColor">
                                {{ event.status }}
                            </span>
                        </div>

                        <div class="event-content p-6">
                            <h3 class="font-bold mb-2" [style.color]="config.titleTextColor" [style.font-size.px]="config.eventTitleSize">
                                {{ event.title }}
                            </h3>

                            <div class="mb-3">
                                <p class="text-sm mb-1" [style.color]="config.dateColor">
                                    <i class="pi pi-calendar mr-2"></i>{{ formatDate(event.startDate) }}
                                </p>
                                <p class="text-sm" [style.color]="config.locationColor">
                                    <i class="pi pi-map-marker mr-2"></i>{{ event.location }}
                                </p>
                            </div>

                            <p class="mb-4" [style.color]="config.descriptionColor" [style.font-size.px]="config.descriptionSize">
                                {{ event.description?.substring(0, 100) }}{{ event.description?.length > 100 ? '...' : '' }}
                            </p>

                            <div class="event-footer flex justify-between items-center">
                                <span class="text-xs" [style.color]="config.attendeesColor">
                                    {{ event.currentAttendees }}/{{ event.maxAttendees }} attending
                                </span>
                                <button pButton 
                                    [label]="config.registerButtonText || 'Register'" 
                                    size="small" 
                                    [style.background-color]="config.buttonColor" 
                                    [style.color]="config.buttonTextColor"
                                    (click)="registerEvent(event)"></button>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="config.showViewAllButton && !loading" class="text-center mt-12">
                    <button pButton 
                        [label]="config.viewAllButtonText || 'View All Events'" 
                        [style.background-color]="config.viewAllButtonColor" 
                        [style.color]="config.viewAllButtonTextColor"
                        (click)="viewAllEvents()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .event-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .event-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        .event-image {
            overflow: hidden;
        }
        .event-image img {
            transition: transform 0.3s ease;
        }
        .event-card:hover .event-image img {
            transform: scale(1.05);
        }
    `]
})
export class NgoEventsWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Upcoming Events',
        subtitle: '',
        backgroundColor: '#f9fafb',
        padding: 40,
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        cardBackgroundColor: '#ffffff',
        titleTextColor: '#111827',
        eventTitleSize: 18,
        dateColor: '#6b7280',
        locationColor: '#6b7280',
        descriptionColor: '#4b5563',
        descriptionSize: 14,
        attendeesColor: '#9ca3af',
        statusTextColor: '#ffffff',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        registerButtonText: 'Register',
        viewAllButtonColor: '#3b82f6',
        viewAllButtonTextColor: '#ffffff',
        viewAllButtonText: 'View All Events',
        showViewAllButton: true,
        eventsUrl: '/ngo/events'
    };

    events: any[] = [];
    loading = true;

    constructor(private ngoService: NgoServiceProxy) {}

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents(): void {
        this.loading = true;
        this.ngoService.getNgoEvents().subscribe({
            next: (data: any) => {
                this.events = (data || []).filter((e: any) => e.status === 'Upcoming').slice(0, 3);
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load events:', error);
                this.loading = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'upcoming': return '#3b82f6';
            case 'ongoing': return '#ef4444';
            case 'completed': return '#10b981';
            default: return '#6b7280';
        }
    }

    registerEvent(event: any): void {
        window.location.href = `${this.config.eventsUrl}?eventId=${event.id}`;
    }

    viewAllEvents(): void {
        window.location.href = this.config.eventsUrl;
    }
}
