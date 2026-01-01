import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BookingService, Booking, BookingWidgetConfig } from '../../../building-blocks/booking-widget/booking.service';

@Component({
    selector: 'app-booking-management',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, CalendarModule, 
        DropdownModule, DialogModule, CardModule, TagModule, ToastModule, 
        ConfirmDialogModule, ToolbarModule, ProgressSpinnerModule, CheckboxModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './booking-management.component.html',
    styles: [`
        .booking-status-pending { background-color: #fff3cd; color: #856404; }
        .booking-status-confirmed { background-color: #d4edda; color: #155724; }
        .booking-status-cancelled { background-color: #f8d7da; color: #721c24; }
        
        .booking-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .booking-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .calendar-view {
            min-height: 600px;
        }
        
        .config-section {
            background-color: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        
        .working-hours-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .day-config {
            background-color: white;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #ddd;
        }
    `]
})
export class BookingManagementComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Data
    bookings = signal<Booking[]>([]);
    filteredBookings = signal<Booking[]>([]);
    bookingConfig = signal<BookingWidgetConfig | null>(null);

    // UI State
    isLoading = signal<boolean>(false);
    showConfigDialog = signal<boolean>(false);
    showBookingDialog = signal<boolean>(false);
    selectedBooking: Booking | null = null;

    // Filters
    dateRange: Date[] | null = null;
    selectedStatus: string | null = null;
    globalFilter: string = '';

    // Status options
    statusOptions = [
        { label: 'All', value: null },
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' }
    ];

    // Days of week for working hours
    daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadBookings();
        this.loadBookingConfig();
    }

    loadBookings(): void {
        this.isLoading.set(true);
        this.bookingService.getBookings().subscribe({
            next: (bookings: Booking[]) => {
                this.bookings.set(bookings);
                this.filteredBookings.set(bookings);
                this.isLoading.set(false);
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load bookings',
                    life: 3000
                });
                this.isLoading.set(false);
            }
        });
    }

    loadBookingConfig(): void {
        this.bookingService.getBookingConfig().subscribe({
            next: (config: BookingWidgetConfig) => {
                this.bookingConfig.set(config);
            },
            error: (error: any) => {
                console.error('Failed to load booking config:', error);
            }
        });
    }

    applyFilters(): void {
        let filtered = [...this.bookings()];

        // Date range filter
        if (this.dateRange && this.dateRange.length === 2) {
            const [startDate, endDate] = this.dateRange;
            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.bookingDate);
                return bookingDate >= startDate && bookingDate <= endDate;
            });
        }

        // Status filter
        if (this.selectedStatus) {
            filtered = filtered.filter(booking => booking.status === this.selectedStatus);
        }

        // Global filter
        if (this.globalFilter) {
            const filterText = this.globalFilter.toLowerCase();
            filtered = filtered.filter(booking =>
                booking.customerName.toLowerCase().includes(filterText) ||
                booking.customerEmail.toLowerCase().includes(filterText) ||
                booking.services.some((service: any) => 
                    service.name.toLowerCase().includes(filterText)
                )
            );
        }

        this.filteredBookings.set(filtered);
    }

    confirmBooking(booking: Booking): void {
        this.bookingService.updateBookingStatus(booking.id, 'confirmed').subscribe({
            next: (updatedBooking: Booking) => {
                this.updateBookingInList(updatedBooking);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Booking Confirmed',
                    detail: `Booking for ${booking.customerName} has been confirmed`,
                    life: 3000
                });
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to confirm booking',
                    life: 3000
                });
            }
        });
    }

    cancelBooking(booking: Booking): void {
        this.confirmationService.confirm({
            header: 'Cancel Booking',
            message: `Are you sure you want to cancel the booking for ${booking.customerName}?`,
            accept: () => {
                this.bookingService.updateBookingStatus(booking.id, 'cancelled').subscribe({
                    next: (updatedBooking: Booking) => {
                        this.updateBookingInList(updatedBooking);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Booking Cancelled',
                            detail: `Booking for ${booking.customerName} has been cancelled`,
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to cancel booking',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    deleteBooking(booking: Booking): void {
        this.confirmationService.confirm({
            header: 'Delete Booking',
            message: `Are you sure you want to delete the booking for ${booking.customerName}? This action cannot be undone.`,
            accept: () => {
                this.bookingService.deleteBooking(booking.id).subscribe({
                    next: () => {
                        this.removeBookingFromList(booking.id);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Booking Deleted',
                            detail: `Booking for ${booking.customerName} has been deleted`,
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete booking',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    viewBookingDetails(booking: Booking): void {
        this.selectedBooking = booking;
        this.showBookingDialog.set(true);
    }

    openConfigDialog(): void {
        this.showConfigDialog.set(true);
    }

    saveBookingConfig(): void {
        if (!this.bookingConfig()) return;

        this.bookingService.updateBookingConfig(this.bookingConfig()!).subscribe({
            next: (config: BookingWidgetConfig) => {
                this.bookingConfig.set(config);
                this.showConfigDialog.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Configuration Saved',
                    detail: 'Booking widget configuration has been updated',
                    life: 3000
                });
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save configuration',
                    life: 3000
                });
            }
        });
    }

    exportBookings(): void {
        // Export to CSV functionality
        const csv = this.convertToCSV(this.filteredBookings());
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private updateBookingInList(updatedBooking: Booking): void {
        const bookings = this.bookings();
        const index = bookings.findIndex(b => b.id === updatedBooking.id);
        if (index > -1) {
            bookings[index] = updatedBooking;
            this.bookings.set([...bookings]);
            this.applyFilters();
        }
    }

    private removeBookingFromList(bookingId: string): void {
        const bookings = this.bookings().filter(b => b.id !== bookingId);
        this.bookings.set(bookings);
        this.applyFilters();
    }

    private convertToCSV(bookings: Booking[]): string {
        const headers = [
            'ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Time', 
            'Services', 'Status', 'Created At'
        ];
        
        const rows = bookings.map(booking => [
            booking.id,
            booking.customerName,
            booking.customerEmail,
            booking.customerPhone || '',
            new Date(booking.bookingDate).toLocaleDateString(),
            booking.timeSlot.time,
            booking.services.map((s: any) => s.name).join('; '),
            booking.status,
            new Date(booking.createdAt).toLocaleString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'cancelled': return 'danger';
            default: return 'info';
        }
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    getTotalServicesPrice(services: any[]): number {
        return services.reduce((total, service) => total + (service.price || 0), 0);
    }
}
