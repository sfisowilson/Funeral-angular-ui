import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-premium-calculator-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputNumberModule, ButtonModule, ColorPickerModule, CardModule],
    template: `
        <div class="space-y-4">
            <p-card header="Content Settings">
                <div class="space-y-3">
                    <div>
                        <label class="block mb-2 font-semibold">Title</label>
                        <input pInputText [(ngModel)]="config.title" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Title Font Size (px)</label>
                        <p-inputNumber [(ngModel)]="config.titleSize" [min]="16" [max]="72" [style]="{ width: '100%' }"></p-inputNumber>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Subtitle</label>
                        <input pInputText [(ngModel)]="config.subtitle" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Subtitle Font Size (px)</label>
                        <p-inputNumber [(ngModel)]="config.subtitleSize" [min]="12" [max]="32" [style]="{ width: '100%' }"></p-inputNumber>
                    </div>
                </div>
            </p-card>

            <p-card header="Button Settings">
                <div class="space-y-3">
                    <div>
                        <label class="block mb-2 font-semibold">Calculate Button Text</label>
                        <input pInputText [(ngModel)]="config.calculateButtonText" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Calculate Button Color</label>
                        <p-colorPicker [(ngModel)]="config.buttonColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Calculate Button Text Color</label>
                        <p-colorPicker [(ngModel)]="config.buttonTextColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Sign Up Button Text</label>
                        <input pInputText [(ngModel)]="config.signupButtonText" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Sign Up Button Color</label>
                        <p-colorPicker [(ngModel)]="config.signupButtonColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Sign Up Button Text Color</label>
                        <p-colorPicker [(ngModel)]="config.signupButtonTextColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Sign Up URL</label>
                        <input pInputText [(ngModel)]="config.signupUrl" class="w-full" placeholder="/register" />
                    </div>
                </div>
            </p-card>

            <p-card header="Result Display Settings">
                <div class="space-y-3">
                    <div>
                        <label class="block mb-2 font-semibold">Result Label</label>
                        <input pInputText [(ngModel)]="config.resultLabel" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Period Text</label>
                        <input pInputText [(ngModel)]="config.resultPeriod" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Currency Symbol</label>
                        <input pInputText [(ngModel)]="config.currency" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Background Color</label>
                        <p-colorPicker [(ngModel)]="config.resultBackgroundColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Border Color</label>
                        <p-colorPicker [(ngModel)]="config.resultBorderColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Label Color</label>
                        <p-colorPicker [(ngModel)]="config.resultLabelColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Amount Color</label>
                        <p-colorPicker [(ngModel)]="config.resultAmountColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Result Period Color</label>
                        <p-colorPicker [(ngModel)]="config.resultPeriodColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                </div>
            </p-card>

            <p-card header="Color Settings">
                <div class="space-y-3">
                    <div>
                        <label class="block mb-2 font-semibold">Background Color</label>
                        <p-colorPicker [(ngModel)]="config.backgroundColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Card Background Color</label>
                        <p-colorPicker [(ngModel)]="config.cardBackgroundColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Title Color</label>
                        <p-colorPicker [(ngModel)]="config.titleColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Subtitle Color</label>
                        <p-colorPicker [(ngModel)]="config.subtitleColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold">Label Color</label>
                        <p-colorPicker [(ngModel)]="config.labelColor" [style]="{ width: '100%' }"></p-colorPicker>
                    </div>
                </div>
            </p-card>

            <p-card header="Layout Settings">
                <div class="space-y-3">
                    <div>
                        <label class="block mb-2 font-semibold">Padding (px)</label>
                        <p-inputNumber [(ngModel)]="config.padding" [min]="0" [max]="100" [style]="{ width: '100%' }"></p-inputNumber>
                    </div>
                </div>
            </p-card>

            <div class="flex justify-end gap-2 mt-4">
                <button pButton label="Cancel" (click)="cancel.emit()" class="p-button-secondary"></button>
                <button pButton label="Save" (click)="save.emit(config)" class="p-button-success"></button>
            </div>
        </div>
    `
})
export class PremiumCalculatorEditorComponent {
    @Input() config: any;
    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();
}
