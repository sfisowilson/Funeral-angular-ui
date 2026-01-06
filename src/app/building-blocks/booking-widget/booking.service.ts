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
    // Calendar Integration
    enableCalendarReminders?: boolean;
    calendarProvider?: 'google' | 'outlook' | 'both';
    // Email Notifications
    enableEmailNotifications?: boolean;
    notificationEmail?: string;
    sendCustomerConfirmation?: boolean;
    sendAdminNotification?: boolean;
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
        return this.http.post<Booking>(`${this.baseUrl}/create`, bookingRequest);
    }

    // Get all bookings for current tenant
    getBookings(): Observable<Booking[]> {
        return this.http.get<Booking[]>(`${this.baseUrl}/list`);
    }

    // Get bookings for a specific date range
    getBookingsByDateRange(startDate: Date, endDate: Date, status?: string): Observable<Booking[]> {
        let params: any = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
        if (status) {
            params.status = status;
        }
        return this.http.get<Booking[]>(`${this.baseUrl}/list`, { params });
    }

    // Update booking status
    updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'pending'): Observable<any> {
        return this.http.put(`${this.baseUrl}/${bookingId}/status`, { status });
    }

    // Delete booking
    deleteBooking(bookingId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${bookingId}`);
    }

    // Get booking widget configuration
    getBookingConfig(): Observable<BookingWidgetConfig> {
        return this.http.get<BookingWidgetConfig>(`${this.baseUrl}/config`).pipe(
            map((config: BookingWidgetConfig) => {
                // Ensure default values for new properties
                return {
                    ...config,
                    enableCalendarReminders: config.enableCalendarReminders ?? false,
                    calendarProvider: config.calendarProvider ?? 'both',
                    enableEmailNotifications: config.enableEmailNotifications ?? false,
                    sendCustomerConfirmation: config.sendCustomerConfirmation ?? true,
                    sendAdminNotification: config.sendAdminNotification ?? false,
                    notificationEmail: config.notificationEmail ?? ''
                };
            })
        );
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

    // Generate iCalendar (.ics) file content for calendar reminders
    generateCalendarEvent(booking: Booking, config: BookingWidgetConfig): string {
        const startDateTime = new Date(booking.bookingDate);
        const [hours, minutes] = booking.timeSlot.time.split(':').map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);

        const duration = booking.services.reduce((total, service: any) => total + (service.duration || 30), 0);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        const formatICalDate = (date: Date): string => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const services = booking.services.map((s: any) => s.name).join(', ');
        const description = `Services: ${services}\\nCustomer: ${booking.customerName}\\nEmail: ${booking.customerEmail}${booking.customerPhone ? `\\nPhone: ${booking.customerPhone}` : ''}${booking.customerNotes ? `\\n\\nNotes: ${booking.customerNotes}` : ''}`;

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Funeral Management System//Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:booking-${booking.id}@funeral-system
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startDateTime)}
DTEND:${formatICalDate(endDateTime)}
SUMMARY:Appointment: ${services}
DESCRIPTION:${description}
LOCATION:${booking.customerNotes || 'To be confirmed'}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Reminder: Appointment in 1 hour
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

        return icsContent;
    }

    // Generate Google Calendar URL
    generateGoogleCalendarUrl(booking: Booking): string {
        const startDateTime = new Date(booking.bookingDate);
        const [hours, minutes] = booking.timeSlot.time.split(':').map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);

        const duration = booking.services.reduce((total, service: any) => total + (service.duration || 30), 0);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        const formatGoogleDate = (date: Date): string => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const services = booking.services.map((s: any) => s.name).join(', ');
        const title = encodeURIComponent(`Appointment: ${services}`);
        const details = encodeURIComponent(`Customer: ${booking.customerName}\nEmail: ${booking.customerEmail}${booking.customerPhone ? `\nPhone: ${booking.customerPhone}` : ''}${booking.customerNotes ? `\n\nNotes: ${booking.customerNotes}` : ''}`);
        const dates = `${formatGoogleDate(startDateTime)}/${formatGoogleDate(endDateTime)}`;

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
    }

    // Generate Outlook Calendar URL
    generateOutlookCalendarUrl(booking: Booking): string {
        const startDateTime = new Date(booking.bookingDate);
        const [hours, minutes] = booking.timeSlot.time.split(':').map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);

        const duration = booking.services.reduce((total, service: any) => total + (service.duration || 30), 0);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        const formatOutlookDate = (date: Date): string => {
            return date.toISOString();
        };

        const services = booking.services.map((s: any) => s.name).join(', ');
        const title = encodeURIComponent(`Appointment: ${services}`);
        const body = encodeURIComponent(`Customer: ${booking.customerName}\nEmail: ${booking.customerEmail}${booking.customerPhone ? `\nPhone: ${booking.customerPhone}` : ''}${booking.customerNotes ? `\n\nNotes: ${booking.customerNotes}` : ''}`);
        const startTime = formatOutlookDate(startDateTime);
        const endTime = formatOutlookDate(endDateTime);

        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&startdt=${startTime}&enddt=${endTime}&path=/calendar/action/compose&rru=addevent`;
    }

    // Download .ics file
    downloadICalFile(booking: Booking, config: BookingWidgetConfig): void {
        const icsContent = this.generateCalendarEvent(booking, config);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `booking-${booking.id}.ics`;
        link.click();
        window.URL.revokeObjectURL(link.href);
    }

    // Send email notifications (calls backend API)
    sendBookingNotifications(booking: Booking, config: BookingWidgetConfig): Observable<any> {
        const payload = {
            booking: {
                id: booking.id,
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                customerPhone: booking.customerPhone,
                customerNotes: booking.customerNotes,
                bookingDate: booking.bookingDate,
                timeSlot: booking.timeSlot,
                services: booking.services,
                status: booking.status,
                createdAt: booking.createdAt
            },
            config: {
                sendCustomerConfirmation: config.sendCustomerConfirmation ?? true,
                sendAdminNotification: config.sendAdminNotification ?? false,
                notificationEmail: config.notificationEmail
            }
        };
        
        return this.http.post(`${this.baseUrl}/send-notifications`, payload).pipe(
            map((response: any) => {
                console.log('Notification response:', response);
                return response;
            }),
            catchError((error) => {
                console.error('Failed to send notifications:', error);
                return of({ success: false, message: 'Failed to send notifications' });
            })
        );
    }
}
