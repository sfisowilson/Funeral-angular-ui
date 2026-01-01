import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-ngo-grant-applications-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, ColorPickerModule, ButtonModule],
    template: `
        <div class="grants-editor p-6">
            <h3 class="text-xl font-bold mb-6">Grant Applications Widget Configuration</h3>
            
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

                <!-- Card Styling -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Card Background Color</label>
                        <p-colorPicker formControlName="cardBackgroundColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Application Title Color</label>
                        <p-colorPicker formControlName="titleTextColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <!-- Accent & Details -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Accent Color (Amounts)</label>
                        <p-colorPicker formControlName="accentColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Details Background Color</label>
                        <p-colorPicker formControlName="detailsBackgroundColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <!-- Button Settings -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Button Color</label>
                        <p-colorPicker formControlName="buttonColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Button Text Color</label>
                        <p-colorPicker formControlName="buttonTextColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">View Details Button Text</label>
                    <input pInputText formControlName="viewDetailsText" class="w-full" />
                </div>

                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Apply Button Text</label>
                    <input pInputText formControlName="applyButtonText" class="w-full" />
                </div>

                <!-- Links -->
                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Grants URL</label>
                    <input pInputText formControlName="grantsUrl" class="w-full" placeholder="/ngo/grant-applications" />
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
export class NgoGrantApplicationsEditorComponent {
    @Input() config: any = {};
    @Output() configChanged = new EventEmitter<any>();
    @Output() closed = new EventEmitter<void>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: ['Funding Opportunities', Validators.required],
            subtitle: ['Explore available grants and funding opportunities'],
            backgroundColor: ['#f9fafb'],
            padding: [40],
            titleColor: ['#111827'],
            titleSize: [32],
            cardBackgroundColor: ['#ffffff'],
            titleTextColor: ['#111827'],
            appTitleSize: [18],
            accentColor: ['#7c3aed'],
            detailsBackgroundColor: ['#f3f4f6'],
            buttonColor: ['#7c3aed'],
            buttonTextColor: ['#ffffff'],
            viewDetailsText: ['View Details'],
            applyButtonText: ['Apply Now'],
            grantsUrl: ['/ngo/grant-applications']
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
