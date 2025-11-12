import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
    selector: 'app-quick-quote-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule],
    template: `
        <div class="quick-quote-editor p-4">
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
                        <label for="buttonText">Button Text</label>
                        <input pInputText id="buttonText" [(ngModel)]="settings.buttonText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="successMessage">Success Message</label>
                        <input pInputText id="successMessage" [(ngModel)]="settings.successMessage" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="titleSize">Title Size</label>
                        <p-inputNumber [(ngModel)]="settings.titleSize" [min]="12" [max]="72" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="subtitleSize">Subtitle Size</label>
                        <p-inputNumber [(ngModel)]="settings.subtitleSize" [min]="12" [max]="32" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="padding">Padding</label>
                        <p-inputNumber [(ngModel)]="settings.padding" [min]="0" [max]="100" class="w-full"></p-inputNumber>
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
                        <label for="subtitleColor">Subtitle Color</label>
                        <p-colorPicker [(ngModel)]="settings.subtitleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="formBackgroundColor">Form Background</label>
                        <p-colorPicker [(ngModel)]="settings.formBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="labelColor">Label Color</label>
                        <p-colorPicker [(ngModel)]="settings.labelColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="buttonColor">Button Color</label>
                        <p-colorPicker [(ngModel)]="settings.buttonColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="buttonTextColor">Button Text Color</label>
                        <p-colorPicker [(ngModel)]="settings.buttonTextColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class QuickQuoteEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
