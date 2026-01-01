import { Component, signal, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BookingService, BookingRequest, TimeSlot, Booking, BookingWidgetConfig } from '../booking-widget/booking.service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

@Component({
    selector: 'app-booking-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CalendarModule, DropdownModule, InputTextModule, TextareaModule, CardModule, ToastModule],
    providers: [MessageService],
    templateUrl: './booking-widget.component.html',
    styles: [`
        .booking-widget {
            max-width: 600px;
            margin: 0 auto;
        }
        .time-slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 0.5rem;
        }
        .time-slot {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        .time-slot:hover {
            background-color: #f8f9fa;
            border-color: #007bff;
        }
        .time-slot.selected {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
        .time-slot.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #f8f9fa;
        }
        .service-item {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .service-item:hover {
            background-color: #f8f9fa;
            border-color: #007bff;
        }
        .service-item.selected {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
        .booking-summary {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
        }
        .form-section {
            margin-bottom: 1.5rem;
        }
        .section-title {
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: #333;
        }
    `]
})
export class BookingWidgetComponent implements OnInit {
    @Input() config: BookingWidgetConfig | null = null;
    @Input() services: any[] = [];
    @Output() bookingCompleted = new EventEmitter<any>();

    // Form data
    selectedDate: Date | null = null;
    selectedTimeSlot: TimeSlot | null = null;
    selectedServices: any[] = [];
    customerInfo = {
        name: '',
        email: '',
        phone: '',
        notes: ''
    };

    // UI state
    availableTimeSlots = signal<TimeSlot[]>([]);
    isLoading = signal<boolean>(false);
    currentStep = signal<number>(1);
    bookingComplete = signal<boolean>(false);

    // Validation
    isFormValid = signal<boolean>(false);

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit() {
        this.loadDefaultConfig();
        this.validateForm();
    }

    private loadDefaultConfig(): void {
        if (!this.config) {
            this.config = {
                showInDashboard: true,
                showOnLandingPage: true,
                requireEmail: true,
                requirePhone: false,
                allowCustomServices: false,
                bookingLeadTime: 24, // 24 hours in advance
                maxBookingDuration: 3, // 3 hours max
                workingHours: {
                    monday: { start: '09:00', end: '17:00', closed: false },
                    tuesday: { start: '09:00', end: '17:00', closed: false },
                    wednesday: { start: '09:00', end: '17:00', closed: false },
                    thursday: { start: '09:00', end: '17:00', closed: false },
                    friday: { start: '09:00', end: '17:00', closed: false },
                    saturday: { start: '09:00', end: '13:00', closed: false },
                    sunday: { start: '09:00', end: '13:00', closed: true }
                }
            };
        }
    }

    onDateSelect(): void {
        if (this.selectedDate) {
            this.loadTimeSlots();
        }
    }

    private loadTimeSlots(): void {
        if (!this.selectedDate || !this.config) return;

        this.isLoading.set(true);
        this.bookingService.getAvailableTimeSlots(this.selectedDate, this.config).subscribe({
            next: (timeSlots: TimeSlot[]) => {
                this.availableTimeSlots.set(timeSlots);
                this.selectedTimeSlot = null;
                this.isLoading.set(false);
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load available time slots',
                    life: 3000
                });
                this.isLoading.set(false);
            }
        });
    }

    selectTimeSlot(timeSlot: TimeSlot): void {
        if (timeSlot.available) {
            this.selectedTimeSlot = timeSlot;
            this.validateForm();
        }
    }

    selectService(service: any): void {
        const index = this.selectedServices.findIndex(s => s.id === service.id);
        if (index > -1) {
            this.selectedServices.splice(index, 1);
        } else {
            this.selectedServices.push(service);
        }
        this.validateForm();
    }

    validateForm(): void {
        const isValid = 
            this.selectedDate !== null &&
            this.selectedTimeSlot !== null &&
            this.selectedServices.length > 0 &&
            this.customerInfo.name.trim() !== '' &&
            (!this.config?.requireEmail || this.customerInfo.email.trim() !== '') &&
            (!this.config?.requirePhone || this.customerInfo.phone.trim() !== '');

        this.isFormValid.set(isValid);
    }

    nextStep(): void {
        if (this.currentStep() < 3) {
            this.currentStep.set(this.currentStep() + 1);
        }
    }

    previousStep(): void {
        if (this.currentStep() > 1) {
            this.currentStep.set(this.currentStep() - 1);
        }
    }

    submitBooking(): void {
        if (!this.isFormValid()) return;

        this.isLoading.set(true);

        const bookingRequest: BookingRequest = {
            customerName: this.customerInfo.name,
            customerEmail: this.customerInfo.email,
            customerPhone: this.customerInfo.phone,
            customerNotes: this.customerInfo.notes,
            bookingDate: this.selectedDate!,
            timeSlot: this.selectedTimeSlot!,
            services: this.selectedServices,
            status: 'pending',
            createdAt: new Date()
        };

        this.bookingService.createBooking(bookingRequest).subscribe({
            next: (booking: Booking) => {
                this.isLoading.set(false);
                this.bookingComplete.set(true);
                this.bookingCompleted.emit(booking);
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Booking Confirmed',
                    detail: 'Your appointment has been successfully booked. You will receive a confirmation email shortly.',
                    life: 5000
                });

                // Reset form after delay
                setTimeout(() => {
                    this.resetForm();
                }, 3000);
            },
            error: (error: any) => {
                this.isLoading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Booking Failed',
                    detail: 'Unable to complete your booking. Please try again or contact us directly.',
                    life: 5000
                });
            }
        });
    }

    private resetForm(): void {
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.selectedServices = [];
        this.customerInfo = {
            name: '',
            email: '',
            phone: '',
            notes: ''
        };
        this.currentStep.set(1);
        this.bookingComplete.set(false);
        this.availableTimeSlots.set([]);
    }

    getTotalDuration(): number {
        return this.selectedServices.reduce((total, service) => total + (service.duration || 30), 0);
    }

    getTotalPrice(): number {
        return this.selectedServices.reduce((total, service) => total + (service.price || 0), 0);
    }

    formatTime(time: string): string {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    isDateSelectable(date: Date): boolean {
        if (!this.config) return false;
        
        const now = new Date();
        const minDate = new Date(now.getTime() + this.config.bookingLeadTime * 60 * 60 * 1000);
        
        return date >= minDate;
    }
}
