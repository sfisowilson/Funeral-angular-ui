import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { EditorModule } from 'primeng/editor';

@Component({
    selector: 'app-faq-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, CheckboxModule, EditorModule],
    template: `
        <div class="faq-editor p-4">
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
                    <div class="field flex items-center">
                        <p-checkbox [(ngModel)]="settings.allowMultiple" inputId="allowMultiple" [binary]="true"></p-checkbox>
                        <label for="allowMultiple" class="ml-2">Allow Multiple Open</label>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Colors" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label for="answerColor">Answer Text Color</label>
                        <p-colorPicker [(ngModel)]="settings.answerColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="answerSize">Answer Text Size</label>
                        <p-inputNumber [(ngModel)]="settings.answerSize" [min]="10" [max]="24" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="accordionHeaderColor">Accordion Header Color</label>
                        <p-colorPicker [(ngModel)]="settings.accordionHeaderColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="accordionTextColor">Accordion Text Color</label>
                        <p-colorPicker [(ngModel)]="settings.accordionTextColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="FAQs" class="mt-4">
                <div *ngFor="let faq of settings.faqs; let i = index" class="faq-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="field">
                            <label>Question</label>
                            <input pInputText [(ngModel)]="faq.question" placeholder="What is your question?" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Answer</label>
                            <p-editor [(ngModel)]="faq.answer" [style]="{ height: '200px' }" placeholder="Enter the answer here..."> </p-editor>
                        </div>
                    </div>
                    <button pButton type="button" label="Remove FAQ" class="p-button-danger p-button-sm mt-2" (click)="removeFaq(i)"></button>
                </div>
                <button pButton type="button" label="Add FAQ" class="p-button-success" (click)="addFaq()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class FaqEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    addFaq(): void {
        if (!this.settings.faqs) {
            this.settings.faqs = [];
        }
        this.settings.faqs.push({
            question: 'New Question',
            answer: 'Answer goes here...'
        });
    }

    removeFaq(index: number): void {
        this.settings.faqs.splice(index, 1);
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
