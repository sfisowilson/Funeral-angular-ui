import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-ngo-donor-recognition-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, ColorPickerModule, ButtonModule],
    template: `
        <div class="donor-editor p-6">
            <h3 class="text-xl font-bold mb-6">Donor Recognition Widget Configuration</h3>
            
            <form [formGroup]="form" class="space-y-4">
                <!-- Title Settings -->
                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Widget Title</label>
                    <input pInputText formControlName="title" class="w-full" />
                </div>

                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Subtitle</label>
                    <input pInputText formControlName="subtitle" class="w-full" />
                </div>

                <!-- Layout Settings -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Background Color</label>
                        <p-colorPicker formControlName="backgroundColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Padding (px)</label>
                        <p-inputNumber formControlName="padding" [min]="10" [max]="100"></p-inputNumber>
                    </div>
                </div>

                <!-- Title Styling -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Title Color</label>
                        <p-colorPicker formControlName="titleColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Title Size (px)</label>
                        <p-inputNumber formControlName="titleSize" [min]="16" [max]="48"></p-inputNumber>
                    </div>
                </div>

                <!-- Level Title Settings -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Level Title Color</label>
                        <p-colorPicker formControlName="levelTitleColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Level Title Size (px)</label>
                        <p-inputNumber formControlName="levelTitleSize" [min]="14" [max]="28"></p-inputNumber>
                    </div>
                </div>

                <!-- Donor Name & Amount -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Donor Name Color</label>
                        <p-colorPicker formControlName="donorNameColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Amount Color</label>
                        <p-colorPicker formControlName="amountColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <!-- Button Settings -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Donate Button Color</label>
                        <p-colorPicker formControlName="donateButtonColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Button Text Color</label>
                        <p-colorPicker formControlName="donateButtonTextColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Donate Button Text</label>
                    <input pInputText formControlName="donateButtonText" class="w-full" />
                </div>

                <!-- Links -->
                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Donation URL</label>
                    <input pInputText formControlName="donationUrl" class="w-full" placeholder="/ngo/donate" />
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 pt-4">
                    <button pButton type="button" label="Save" (click)="save()" class="flex-1"></button>
                    <button pButton type="button" label="Cancel" severity="secondary" (click)="cancel()" class="flex-1"></button>
                </div>
            </form>
        </div>
    `,
    styles: [`
        .form-group {
            display: flex;
            flex-direction: column;
        }
    `]
})
export class NgoDonorRecognitionEditorComponent {
    @Input() config: any = {};
    @Output() configChanged = new EventEmitter<any>();
    @Output() closed = new EventEmitter<void>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: ['Our Donors', Validators.required],
            subtitle: ['With gratitude to those who support our mission'],
            backgroundColor: ['#f9fafb'],
            padding: [40],
            titleColor: ['#111827'],
            titleSize: [32],
            levelTitleColor: ['#374151'],
            levelTitleSize: [20],
            donorNameColor: ['#111827'],
            amountColor: ['#059669'],
            donateButtonColor: ['#059669'],
            donateButtonTextColor: ['#ffffff'],
            donateButtonText: ['Make a Donation'],
            donationUrl: ['/ngo/donate']
        });

        if (this.config && Object.keys(this.config).length > 0) {
            this.form.patchValue(this.config);
        }
    }

    save(): void {
        if (this.form.valid) {
            this.configChanged.emit(this.form.value);
        }
    }

    cancel(): void {
        this.closed.emit();
    }
}
