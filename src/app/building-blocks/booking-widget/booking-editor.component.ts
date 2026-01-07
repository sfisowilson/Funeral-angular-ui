import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AccordionModule } from 'primeng/accordion';
import { InputSwitchModule } from 'primeng/inputswitch';

export interface BookingWidgetEditorConfig {
    // Display settings
    title: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    buttonColor: string;
    buttonTextColor: string;
    
    // Booking configuration
    showInDashboard: boolean;
    showOnLandingPage: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    allowCustomServices: boolean;
    bookingLeadTime: number;
    maxBookingDuration: number;
    slotDuration: number;
    
    // Working hours (simplified for editor)
    enableMonday: boolean;
    mondayStart: string;
    mondayEnd: string;
    enableTuesday: boolean;
    tuesdayStart: string;
    tuesdayEnd: string;
    enableWednesday: boolean;
    wednesdayStart: string;
    wednesdayEnd: string;
    enableThursday: boolean;
    thursdayStart: string;
    thursdayEnd: string;
    enableFriday: boolean;
    fridayStart: string;
    fridayEnd: string;
    enableSaturday: boolean;
    saturdayStart: string;
    saturdayEnd: string;
    enableSunday: boolean;
    sundayStart: string;
    sundayEnd: string;
    
    // Notifications
    enableEmailNotifications: boolean;
    notificationEmail: string;
    sendCustomerConfirmation: boolean;
    sendAdminNotification: boolean;
    
    // Calendar
    enableCalendarReminders: boolean;
    calendarProvider: string;
}

@Component({
    selector: 'app-booking-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        InputTextModule,
        CheckboxModule,
        InputNumberModule,
        DropdownModule,
        ColorPickerModule,
        AccordionModule,
        InputSwitchModule
    ],
    template: `
        <div class="booking-editor p-4" style="min-height: 400px; overflow: visible;">
            <p-accordion [multiple]="true" [activeIndex]="[0]">
                <!-- Display Settings -->
                <p-accordionTab header="Display Settings">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field">
                            <label class="block mb-2 font-semibold">Widget Title</label>
                            <input pInputText [(ngModel)]="config.title" class="w-full" 
                                   (ngModelChange)="onChange()" />
                        </div>
                        <div class="field">
                            <label class="block mb-2 font-semibold">Subtitle</label>
                            <input pInputText [(ngModel)]="config.subtitle" class="w-full" 
                                   (ngModelChange)="onChange()" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="field">
                                <label class="block mb-2 font-semibold">Background Color</label>
                                <p-colorPicker [(ngModel)]="config.backgroundColor" 
                                              (ngModelChange)="onChange()"></p-colorPicker>
                            </div>
                            <div class="field">
                                <label class="block mb-2 font-semibold">Text Color</label>
                                <p-colorPicker [(ngModel)]="config.textColor" 
                                              (ngModelChange)="onChange()"></p-colorPicker>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="field">
                                <label class="block mb-2 font-semibold">Accent Color</label>
                                <p-colorPicker [(ngModel)]="config.accentColor" 
                                              (ngModelChange)="onChange()"></p-colorPicker>
                            </div>
                            <div class="field">
                                <label class="block mb-2 font-semibold">Button Color</label>
                                <p-colorPicker [(ngModel)]="config.buttonColor" 
                                              (ngModelChange)="onChange()"></p-colorPicker>
                            </div>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Booking Settings -->
                <p-accordionTab header="Booking Settings">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center gap-2">
                            <p-inputSwitch [(ngModel)]="config.requireEmail" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Require Email</label>
                        </div>
                        <div class="field flex items-center gap-2">
                            <p-inputSwitch [(ngModel)]="config.requirePhone" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Require Phone Number</label>
                        </div>
                        <div class="field">
                            <label class="block mb-2 font-semibold">Minimum Lead Time (hours)</label>
                            <p-inputNumber [(ngModel)]="config.bookingLeadTime" [min]="1" [max]="168" 
                                          (ngModelChange)="onChange()"></p-inputNumber>
                            <small class="text-gray-500">Hours in advance required for booking</small>
                        </div>
                        <div class="field">
                            <label class="block mb-2 font-semibold">Max Booking Duration (hours)</label>
                            <p-inputNumber [(ngModel)]="config.maxBookingDuration" [min]="1" [max]="8" 
                                          (ngModelChange)="onChange()"></p-inputNumber>
                        </div>
                        <div class="field">
                            <label class="block mb-2 font-semibold">Time Slot Duration (minutes)</label>
                            <p-dropdown [(ngModel)]="config.slotDuration" [options]="slotDurationOptions" 
                                       optionLabel="label" optionValue="value"
                                       [appendTo]="'body'" [style]="{width:'100%'}"
                                       (ngModelChange)="onChange()"></p-dropdown>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Working Hours -->
                <p-accordionTab header="Working Hours">
                    <div class="space-y-4">
                        <!-- Monday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableMonday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Monday</span>
                            <input pInputText [(ngModel)]="config.mondayStart" class="w-20" 
                                   [disabled]="!config.enableMonday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.mondayEnd" class="w-20" 
                                   [disabled]="!config.enableMonday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Tuesday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableTuesday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Tuesday</span>
                            <input pInputText [(ngModel)]="config.tuesdayStart" class="w-20" 
                                   [disabled]="!config.enableTuesday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.tuesdayEnd" class="w-20" 
                                   [disabled]="!config.enableTuesday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Wednesday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableWednesday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Wednesday</span>
                            <input pInputText [(ngModel)]="config.wednesdayStart" class="w-20" 
                                   [disabled]="!config.enableWednesday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.wednesdayEnd" class="w-20" 
                                   [disabled]="!config.enableWednesday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Thursday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableThursday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Thursday</span>
                            <input pInputText [(ngModel)]="config.thursdayStart" class="w-20" 
                                   [disabled]="!config.enableThursday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.thursdayEnd" class="w-20" 
                                   [disabled]="!config.enableThursday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Friday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableFriday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Friday</span>
                            <input pInputText [(ngModel)]="config.fridayStart" class="w-20" 
                                   [disabled]="!config.enableFriday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.fridayEnd" class="w-20" 
                                   [disabled]="!config.enableFriday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Saturday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableSaturday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Saturday</span>
                            <input pInputText [(ngModel)]="config.saturdayStart" class="w-20" 
                                   [disabled]="!config.enableSaturday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.saturdayEnd" class="w-20" 
                                   [disabled]="!config.enableSaturday" (ngModelChange)="onChange()" />
                        </div>
                        <!-- Sunday -->
                        <div class="flex items-center gap-4">
                            <p-inputSwitch [(ngModel)]="config.enableSunday" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <span class="w-24 font-semibold">Sunday</span>
                            <input pInputText [(ngModel)]="config.sundayStart" class="w-20" 
                                   [disabled]="!config.enableSunday" (ngModelChange)="onChange()" />
                            <span>to</span>
                            <input pInputText [(ngModel)]="config.sundayEnd" class="w-20" 
                                   [disabled]="!config.enableSunday" (ngModelChange)="onChange()" />
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Notifications -->
                <p-accordionTab header="Notifications">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center gap-2">
                            <p-inputSwitch [(ngModel)]="config.enableEmailNotifications" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Enable Email Notifications</label>
                        </div>
                        <div class="field" *ngIf="config.enableEmailNotifications">
                            <label class="block mb-2 font-semibold">Notification Email</label>
                            <input pInputText [(ngModel)]="config.notificationEmail" class="w-full" 
                                   (ngModelChange)="onChange()" />
                        </div>
                        <div class="field flex items-center gap-2" *ngIf="config.enableEmailNotifications">
                            <p-inputSwitch [(ngModel)]="config.sendCustomerConfirmation" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Send Customer Confirmation Email</label>
                        </div>
                        <div class="field flex items-center gap-2" *ngIf="config.enableEmailNotifications">
                            <p-inputSwitch [(ngModel)]="config.sendAdminNotification" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Send Admin Notification</label>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Calendar Integration -->
                <p-accordionTab header="Calendar Integration">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field flex items-center gap-2">
                            <p-inputSwitch [(ngModel)]="config.enableCalendarReminders" 
                                          (ngModelChange)="onChange()"></p-inputSwitch>
                            <label>Enable Calendar Reminders</label>
                        </div>
                        <div class="field" *ngIf="config.enableCalendarReminders">
                            <label class="block mb-2 font-semibold">Calendar Provider</label>
                            <p-dropdown [(ngModel)]="config.calendarProvider" [options]="calendarOptions" 
                                       optionLabel="label" optionValue="value"
                                       [appendTo]="'body'" [style]="{width:'100%'}"
                                       (ngModelChange)="onChange()"></p-dropdown>
                        </div>
                    </div>
                </p-accordionTab>
            </p-accordion>
        </div>
    `
})
export class BookingEditorComponent {
    @Input() config: BookingWidgetEditorConfig = this.getDefaultConfig();
    @Output() configChange = new EventEmitter<BookingWidgetEditorConfig>();

    slotDurationOptions = [
        { label: '15 minutes', value: 15 },
        { label: '30 minutes', value: 30 },
        { label: '45 minutes', value: 45 },
        { label: '60 minutes', value: 60 },
        { label: '90 minutes', value: 90 },
        { label: '120 minutes', value: 120 }
    ];

    calendarOptions = [
        { label: 'Google Calendar', value: 'google' },
        { label: 'Outlook Calendar', value: 'outlook' },
        { label: 'Both (Download .ics)', value: 'both' }
    ];

    getDefaultConfig(): BookingWidgetEditorConfig {
        return {
            title: 'Book an Appointment',
            subtitle: 'Schedule a convenient time to meet with us',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            accentColor: '#007bff',
            buttonColor: '#007bff',
            buttonTextColor: '#ffffff',
            showInDashboard: true,
            showOnLandingPage: true,
            requireEmail: true,
            requirePhone: false,
            allowCustomServices: false,
            bookingLeadTime: 24,
            maxBookingDuration: 3,
            slotDuration: 30,
            enableMonday: true,
            mondayStart: '09:00',
            mondayEnd: '17:00',
            enableTuesday: true,
            tuesdayStart: '09:00',
            tuesdayEnd: '17:00',
            enableWednesday: true,
            wednesdayStart: '09:00',
            wednesdayEnd: '17:00',
            enableThursday: true,
            thursdayStart: '09:00',
            thursdayEnd: '17:00',
            enableFriday: true,
            fridayStart: '09:00',
            fridayEnd: '17:00',
            enableSaturday: true,
            saturdayStart: '09:00',
            saturdayEnd: '13:00',
            enableSunday: false,
            sundayStart: '09:00',
            sundayEnd: '13:00',
            enableEmailNotifications: true,
            notificationEmail: '',
            sendCustomerConfirmation: true,
            sendAdminNotification: true,
            enableCalendarReminders: true,
            calendarProvider: 'both'
        };
    }

    onChange(): void {
        this.configChange.emit(this.config);
    }
}
