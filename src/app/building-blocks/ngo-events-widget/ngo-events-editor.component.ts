import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-ngo-events-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, CheckboxModule, DropdownModule],
    template: `
        <div class="ngo-events-editor p-4">
            <p-fieldset legend="General Settings">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="title">Title</label>
                        <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="subtitle">Subtitle</label>
                        <input pInputText id="subtitle" [(ngModel)]="settings.subtitle" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="registerButtonText">Register Button Text</label>
                        <input pInputText id="registerButtonText" [(ngModel)]="settings.registerButtonText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="viewAllButtonText">View All Button Text</label>
                        <input pInputText id="viewAllButtonText" [(ngModel)]="settings.viewAllButtonText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="eventsUrl">Events Page URL</label>
                        <input pInputText id="eventsUrl" [(ngModel)]="settings.eventsUrl" placeholder="/ngo/events" class="w-full" />
                    </div>
                    <div class="field flex items-center">
                        <p-checkbox [(ngModel)]="settings.showViewAllButton" inputId="showViewAllButton" [binary]="true"></p-checkbox>
                        <label for="showViewAllButton" class="ml-2">Show View All Button</label>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Colors" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="backgroundColor">Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.backgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="titleColor">Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="cardBackgroundColor">Card Background</label>
                        <p-colorPicker [(ngModel)]="settings.cardBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="titleTextColor">Event Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleTextColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="dateColor">Date Color</label>
                        <p-colorPicker [(ngModel)]="settings.dateColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="buttonColor">Button Color</label>
                        <p-colorPicker [(ngModel)]="settings.buttonColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Typography" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="titleSize">Title Font Size (px)</label>
                        <p-inputNumber id="titleSize" [(ngModel)]="settings.titleSize" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="eventTitleSize">Event Title Size (px)</label>
                        <p-inputNumber id="eventTitleSize" [(ngModel)]="settings.eventTitleSize" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="padding">Padding (px)</label>
                        <p-inputNumber id="padding" [(ngModel)]="settings.padding" class="w-full"></p-inputNumber>
                    </div>
                </div>
            </p-fieldset>
        </div>
    `
})
export class NgoEventsEditorComponent {
    @Input() settings: any = {};
    @Output() settingsChange = new EventEmitter<any>();

    ngOnInit(): void {
        if (!this.settings || Object.keys(this.settings).length === 0) {
            this.settings = {
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
        }
    }
}
