import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-pricing-table-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputTextarea, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, CheckboxModule],
    template: `
        <div class="pricing-table-editor p-4">
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
                        <label for="currency">Currency Symbol</label>
                        <input pInputText id="currency" [(ngModel)]="settings.currency" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="defaultButtonText">Default Button Text</label>
                        <input pInputText id="defaultButtonText" [(ngModel)]="settings.defaultButtonText" class="w-full" />
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Colors & Styling" class="mt-4">
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
                        <label for="cardBackgroundColor">Card Background</label>
                        <p-colorPicker [(ngModel)]="settings.cardBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="priceColor">Price Color</label>
                        <p-colorPicker [(ngModel)]="settings.priceColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="buttonColor">Button Color</label>
                        <p-colorPicker [(ngModel)]="settings.buttonColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Pricing Plans" class="mt-4">
                <div *ngFor="let plan of settings.pricingPlans; let i = index" class="plan-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label>Plan Name</label>
                            <input pInputText [(ngModel)]="plan.name" placeholder="Basic Plan" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Price</label>
                            <p-inputNumber [(ngModel)]="plan.price" [min]="0" class="w-full"></p-inputNumber>
                        </div>
                        <div class="field">
                            <label>Period</label>
                            <input pInputText [(ngModel)]="plan.period" placeholder="month" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Button Text (Optional)</label>
                            <input pInputText [(ngModel)]="plan.buttonText" placeholder="Choose Plan" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Button Link (Optional)</label>
                            <input pInputText [(ngModel)]="plan.buttonLink" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field flex items-center">
                            <p-checkbox [(ngModel)]="plan.featured" inputId="featured{{ i }}" [binary]="true"></p-checkbox>
                            <label for="featured{{ i }}" class="ml-2">Featured Plan</label>
                        </div>
                        <div class="field col-span-full">
                            <label>Description</label>
                            <textarea pInputTextarea [(ngModel)]="plan.description" placeholder="Plan description..." class="w-full" rows="2"></textarea>
                        </div>
                    </div>

                    <div class="features-section mt-4">
                        <label class="block mb-2 font-semibold">Features</label>
                        <div *ngFor="let feature of plan.features; let fi = index" class="flex gap-2 mb-2">
                            <input pInputText [(ngModel)]="plan.features[fi]" placeholder="Feature description" class="flex-1" />
                            <button pButton type="button" icon="pi pi-trash" class="p-button-danger p-button-sm" (click)="removeFeature(i, fi)"></button>
                        </div>
                        <button pButton type="button" label="Add Feature" class="p-button-success p-button-sm" (click)="addFeature(i)"></button>
                    </div>

                    <button pButton type="button" label="Remove Plan" class="p-button-danger p-button-sm mt-4" (click)="removePlan(i)"></button>
                </div>
                <button pButton type="button" label="Add Plan" class="p-button-success" (click)="addPlan()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class PricingTableEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    addPlan(): void {
        if (!this.settings.pricingPlans) {
            this.settings.pricingPlans = [];
        }
        this.settings.pricingPlans.push({
            name: 'New Plan',
            price: 99,
            period: 'month',
            description: 'Plan description...',
            features: ['Feature 1', 'Feature 2'],
            buttonText: '',
            buttonLink: '',
            featured: false
        });
    }

    removePlan(index: number): void {
        this.settings.pricingPlans.splice(index, 1);
    }

    addFeature(planIndex: number): void {
        if (!this.settings.pricingPlans[planIndex].features) {
            this.settings.pricingPlans[planIndex].features = [];
        }
        this.settings.pricingPlans[planIndex].features.push('New Feature');
    }

    removeFeature(planIndex: number, featureIndex: number): void {
        this.settings.pricingPlans[planIndex].features.splice(featureIndex, 1);
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
