import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface TimeSlot {
    time: string;
    available: boolean;
    reason?: string; // if not available, why
}

export interface BookingRequest {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerNotes?: string;
    bookingDate: Date;
    timeSlot: TimeSlot;
    services: any[];
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
}

export interface Booking {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerNotes?: string;
    bookingDate: Date;
    timeSlot: TimeSlot;
    services: any[];
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
}

export interface BookingWidgetConfig {
    showInDashboard: boolean;
    showOnLandingPage: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    allowCustomServices: boolean;
    bookingLeadTime: number;
    maxBookingDuration: number;
    workingHours: {
        monday: { start: string; end: string; closed: boolean };
        tuesday: { start: string; end: string; closed: boolean };
        wednesday: { start: string; end: string; closed: boolean };
        thursday: { start: string; end: string; closed: boolean };
        friday: { start: string; end: string; closed: boolean };
        saturday: { start: string; end: string; closed: boolean };
        sunday: { start: string; end: string; closed: boolean };
    };
}

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private baseUrl = '/api/booking';

    constructor(private http: HttpClient) {}

    // Get available time slots for a specific date
    getAvailableTimeSlots(date: Date, config: BookingWidgetConfig): Observable<TimeSlot[]> {
        // For now, generate time slots client-side
        // In production, this would call the backend API
        return of(this.generateTimeSlots(date, config));
        
        // Backend implementation would be:
        // return this.http.post<TimeSlot[]>(`${this.baseUrl}/time-slots`, { date, config });
    }

    // Create a new booking
    createBooking(bookingRequest: BookingRequest): Observable<Booking> {
        // For now, simulate API call
        return of(this.createMockBooking(bookingRequest));
        
        // Backend implementation would be:
        // return this.http.post<Booking>(`${this.baseUrl}/create`, bookingRequest);
    }

    // Get all bookings for current tenant
    getBookings(): Observable<Booking[]> {
        return this.http.get<Booking[]>(`${this.baseUrl}/tenant`);
    }

    // Get bookings for a specific date range
    getBookingsByDateRange(startDate: Date, endDate: Date): Observable<Booking[]> {
        return this.http.get<Booking[]>(`${this.baseUrl}/range`, {
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });
    }

    // Update booking status
    updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled'): Observable<Booking> {
        return this.http.put<Booking>(`${this.baseUrl}/${bookingId}/status`, { status });
    }

    // Delete booking
    deleteBooking(bookingId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${bookingId}`);
    }

    // Get booking widget configuration
    getBookingConfig(): Observable<BookingWidgetConfig> {
        return this.http.get<BookingWidgetConfig>(`${this.baseUrl}/config`);
    }

    // Update booking widget configuration
    updateBookingConfig(config: BookingWidgetConfig): Observable<BookingWidgetConfig> {
        return this.http.put<BookingWidgetConfig>(`${this.baseUrl}/config`, config);
    }

    // Generate time slots client-side (for demo purposes)
    private generateTimeSlots(date: Date, config: BookingWidgetConfig): TimeSlot[] {
        const timeSlots: TimeSlot[] = [];
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayDay = dayNames[dayOfWeek];
        const dayConfig = config.workingHours[todayDay as keyof typeof config.workingHours];

        if (dayConfig.closed) {
            return [];
        }

        const [startHour, startMinute] = dayConfig.start.split(':').map(Number);
        const [endHour, endMinute] = dayConfig.end.split(':').map(Number);

        const startTime = new Date(date);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endHour, endMinute, 0, 0);

        // Generate 30-minute slots
        const currentTime = new Date(startTime);
        while (currentTime < endTime) {
            const timeString = this.formatTime(currentTime);
            const available = this.isTimeSlotAvailable(currentTime, date, config);
            
            timeSlots.push({
                time: timeString,
                available,
                reason: available ? undefined : 'Already booked'
            });

            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        return timeSlots;
    }

    private isTimeSlotAvailable(time: Date, date: Date, config: BookingWidgetConfig): boolean {
        // Check if time is in the past
        const now = new Date();
        const minBookingTime = new Date(now.getTime() + config.bookingLeadTime * 60 * 60 * 1000);
        const slotDateTime = new Date(date);
        slotDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

        if (slotDateTime < minBookingTime) {
            return false;
        }

        // In production, this would check against existing bookings in the database
        // For demo, randomly mark some slots as unavailable
        const random = Math.random();
        return random > 0.2; // 80% availability for demo
    }

    private formatTime(date: Date): string {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    private createMockBooking(bookingRequest: BookingRequest): Booking {
        return {
            id: this.generateId(),
            customerName: bookingRequest.customerName,
            customerEmail: bookingRequest.customerEmail,
            customerPhone: bookingRequest.customerPhone,
            customerNotes: bookingRequest.customerNotes,
            bookingDate: bookingRequest.bookingDate,
            timeSlot: bookingRequest.timeSlot,
            services: bookingRequest.services,
            status: 'confirmed',
            createdAt: bookingRequest.createdAt,
            updatedAt: new Date(),
            tenantId: 'current-tenant-id' // Would get from auth service
        };
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
