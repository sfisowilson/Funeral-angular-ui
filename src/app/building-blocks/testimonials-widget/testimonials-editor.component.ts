import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { SliderModule } from 'primeng/slider';

@Component({
    selector: 'app-testimonials-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputTextarea, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, SliderModule],
    template: `
        <div class="testimonials-editor p-4">
            <p-fieldset legend="General Settings">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="title">Title</label>
                        <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="titleSize">Title Size</label>
                        <p-inputNumber [(ngModel)]="settings.titleSize" [min]="12" [max]="72" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="titleColor">Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="backgroundColor">Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.backgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="padding">Padding</label>
                        <p-inputNumber [(ngModel)]="settings.padding" [min]="0" [max]="100" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="cardBackgroundColor">Card Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.cardBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Carousel Settings" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="numVisible">Number Visible</label>
                        <p-inputNumber [(ngModel)]="settings.numVisible" [min]="1" [max]="5" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="autoplayInterval">Autoplay Interval (ms)</label>
                        <p-inputNumber [(ngModel)]="settings.autoplayInterval" [min]="1000" [max]="10000" class="w-full"></p-inputNumber>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Text Settings" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="textColor">Text Color</label>
                        <p-colorPicker [(ngModel)]="settings.textColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="textSize">Text Size</label>
                        <p-inputNumber [(ngModel)]="settings.textSize" [min]="12" [max]="24" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="nameColor">Name Color</label>
                        <p-colorPicker [(ngModel)]="settings.nameColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="nameSize">Name Size</label>
                        <p-inputNumber [(ngModel)]="settings.nameSize" [min]="12" [max]="24" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="positionColor">Position Color</label>
                        <p-colorPicker [(ngModel)]="settings.positionColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="starColor">Star Color</label>
                        <p-colorPicker [(ngModel)]="settings.starColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Testimonials" class="mt-4">
                <div *ngFor="let testimonial of settings.testimonials; let i = index" class="testimonial-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label>Name</label>
                            <input pInputText [(ngModel)]="testimonial.name" placeholder="John Doe" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Position (Optional)</label>
                            <input pInputText [(ngModel)]="testimonial.position" placeholder="Happy Customer" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Photo URL (Optional)</label>
                            <input pInputText [(ngModel)]="testimonial.photo" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field">
                            <label>Rating (1-5)</label>
                            <p-inputNumber [(ngModel)]="testimonial.rating" [min]="1" [max]="5" class="w-full"></p-inputNumber>
                        </div>
                        <div class="field col-span-full">
                            <label>Testimonial Text</label>
                            <textarea pInputTextarea [(ngModel)]="testimonial.text" placeholder="This company provided excellent service..." class="w-full" rows="3"></textarea>
                        </div>
                    </div>
                    <button pButton type="button" label="Remove" class="p-button-danger p-button-sm mt-2" (click)="removeTestimonial(i)"></button>
                </div>
                <button pButton type="button" label="Add Testimonial" class="p-button-success" (click)="addTestimonial()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class TestimonialsEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            // Fix: Use config directly instead of config.settings
            this.settings = { ...this.config };
        }
    }

    addTestimonial(): void {
        if (!this.settings.testimonials) {
            this.settings.testimonials = [];
        }
        this.settings.testimonials.push({
            name: 'New Customer',
            position: '',
            text: 'Add testimonial text here...',
            photo: '',
            rating: 5
        });
    }

    removeTestimonial(index: number): void {
        this.settings.testimonials.splice(index, 1);
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
