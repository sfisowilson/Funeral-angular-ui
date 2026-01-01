import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-ngo-donation-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, ColorPickerModule, ButtonModule],
    template: `
        <div class="donation-editor p-6">
            <h3 class="text-xl font-bold mb-6">Donation Widget Configuration</h3>
            
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

                <!-- Mission Statement -->
                <div class="form-group">
                    <label class="block text-sm font-medium mb-2">Mission Statement</label>
                    <textarea pInputTextarea formControlName="missionStatement" class="w-full" rows="3"></textarea>
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
                        <label class="block text-sm font-medium mb-2">Accent Color</label>
                        <p-colorPicker formControlName="accentColor" appendTo="body"></p-colorPicker>
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

                <!-- Amount Button Colors -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Amount Button Background</label>
                        <p-colorPicker formControlName="amountButtonColor" appendTo="body"></p-colorPicker>
                    </div>

                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Amount Button Text</label>
                        <p-colorPicker formControlName="amountButtonTextColor" appendTo="body"></p-colorPicker>
                    </div>
                </div>

                <!-- Impact Stats -->
                <div class="border-t pt-4 mt-4">
                    <h4 class="font-semibold mb-4">Impact Statistics Display</h4>
                    
                    <div class="form-group">
                        <label class="block text-sm font-medium mb-2">Show Impact Stats</label>
                        <input type="checkbox" formControlName="showImpactStats" />
                    </div>

                    <div class="grid grid-cols-3 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">Total Donations</label>
                            <input pInputText formControlName="totalDonations" class="w-full" />
                        </div>

                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">Donor Count</label>
                            <input pInputText formControlName="donorCount" class="w-full" />
                        </div>

                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">Projects Supported</label>
                            <input pInputText formControlName="projectsSupported" class="w-full" />
                        </div>
                    </div>
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
        input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
    `]
})
export class NgoDonationEditorComponent {
    @Input() config: any = {};
    @Output() configChanged = new EventEmitter<any>();
    @Output() closed = new EventEmitter<void>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: ['Make a Donation', Validators.required],
            subtitle: ['Support our mission and create lasting change'],
            backgroundColor: ['#f9fafb'],
            padding: [40],
            cardBackgroundColor: ['#ffffff'],
            titleColor: ['#111827'],
            titleSize: [32],
            subtitleColor: ['#6b7280'],
            accentColor: ['#059669'],
            amountButtonColor: ['#e0f2fe'],
            amountButtonTextColor: ['#0369a1'],
            donateButtonColor: ['#059669'],
            donateButtonTextColor: ['#ffffff'],
            missionStatement: ['Your generous donation directly supports our mission to create meaningful change in our community.'],
            showImpactStats: [true],
            totalDonations: ['R245,000'],
            donorCount: ['1,234'],
            projectsSupported: ['42'],
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
