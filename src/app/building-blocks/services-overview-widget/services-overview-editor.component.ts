import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-services-overview-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule, CheckboxModule],
    template: `
        <div class="services-overview-editor p-4">
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
                        <label for="featuredBadgeText">Featured Badge Text</label>
                        <input pInputText id="featuredBadgeText" [(ngModel)]="settings.featuredBadgeText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="viewAllButtonText">View All Button Text</label>
                        <input pInputText id="viewAllButtonText" [(ngModel)]="settings.viewAllButtonText" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="allServicesUrl">All Services URL</label>
                        <input pInputText id="allServicesUrl" [(ngModel)]="settings.allServicesUrl" placeholder="https://..." class="w-full" />
                    </div>
                    <div class="field flex items-center">
                        <p-checkbox [(ngModel)]="settings.showViewAllButton" inputId="showViewAllButton" [binary]="true"></p-checkbox>
                        <label for="showViewAllButton" class="ml-2">Show View All Button</label>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Styling" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <label for="iconColor">Icon Color</label>
                        <p-colorPicker [(ngModel)]="settings.iconColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="serviceTitleColor">Service Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.serviceTitleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="descriptionColor">Description Color</label>
                        <p-colorPicker [(ngModel)]="settings.descriptionColor" class="w-full"></p-colorPicker>
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

            <p-fieldset legend="Services" class="mt-4">
                <div *ngFor="let service of settings.services; let i = index" class="service-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label>Service Title</label>
                            <input pInputText [(ngModel)]="service.title" placeholder="Service Name" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Icon (PrimeIcons class)</label>
                            <input pInputText [(ngModel)]="service.icon" placeholder="pi pi-shield" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Image URL</label>
                            <input pInputText [(ngModel)]="service.imageUrl" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field">
                            <label>Button Text</label>
                            <input pInputText [(ngModel)]="service.buttonText" placeholder="Learn More" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Button Link</label>
                            <input pInputText [(ngModel)]="service.buttonLink" placeholder="https://..." class="w-full" />
                        </div>
                        <div class="field flex items-center">
                            <p-checkbox [(ngModel)]="service.featured" inputId="serviceFeatured{{ i }}" [binary]="true"></p-checkbox>
                            <label for="serviceFeatured{{ i }}" class="ml-2">Featured Service</label>
                        </div>
                        <div class="field col-span-full">
                            <label>Description</label>
                            <textarea [(ngModel)]="service.description" placeholder="Service description..." class="w-full p-3 border border-gray-300 rounded-md" rows="2"></textarea>
                        </div>
                    </div>

                    <div class="pricing-section mt-4" *ngIf="service.pricing">
                        <h4 class="font-semibold mb-2">Pricing</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="field">
                                <label>Price</label>
                                <p-inputNumber [(ngModel)]="service.pricing.price" [min]="0" class="w-full"></p-inputNumber>
                            </div>
                            <div class="field">
                                <label>Period</label>
                                <input pInputText [(ngModel)]="service.pricing.period" placeholder="month" class="w-full" />
                            </div>
                            <div class="field">
                                <label>Original Price (optional)</label>
                                <p-inputNumber [(ngModel)]="service.pricing.originalPrice" [min]="0" class="w-full"></p-inputNumber>
                            </div>
                        </div>
                    </div>

                    <div class="features-section mt-4">
                        <label class="block mb-2 font-semibold">Features</label>
                        <div *ngFor="let feature of service.features; let fi = index" class="flex gap-2 mb-2">
                            <input pInputText [(ngModel)]="service.features[fi]" placeholder="Feature description" class="flex-1" />
                            <button pButton type="button" icon="pi pi-trash" class="p-button-danger p-button-sm" (click)="removeFeature(i, fi)"></button>
                        </div>
                        <button pButton type="button" label="Add Feature" class="p-button-success p-button-sm" (click)="addFeature(i)"></button>
                    </div>

                    <div class="mt-4 flex gap-2">
                        <button pButton type="button" label="Add Pricing" class="p-button-info p-button-sm" *ngIf="!service.pricing" (click)="addPricing(i)"></button>
                        <button pButton type="button" label="Remove Pricing" class="p-button-warning p-button-sm" *ngIf="service.pricing" (click)="removePricing(i)"></button>
                        <button pButton type="button" label="Remove Service" class="p-button-danger p-button-sm" (click)="removeService(i)"></button>
                    </div>
                </div>
                <button pButton type="button" label="Add Service" class="p-button-success" (click)="addService()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class ServicesOverviewEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    addService(): void {
        if (!this.settings.services) {
            this.settings.services = [];
        }
        this.settings.services.push({
            title: 'New Service',
            description: 'Service description...',
            icon: 'pi pi-shield',
            imageUrl: '',
            features: ['Feature 1', 'Feature 2'],
            buttonText: 'Learn More',
            buttonLink: '',
            featured: false,
            pricing: null
        });
    }

    removeService(index: number): void {
        this.settings.services.splice(index, 1);
    }

    addFeature(serviceIndex: number): void {
        if (!this.settings.services[serviceIndex].features) {
            this.settings.services[serviceIndex].features = [];
        }
        this.settings.services[serviceIndex].features.push('New Feature');
    }

    removeFeature(serviceIndex: number, featureIndex: number): void {
        this.settings.services[serviceIndex].features.splice(featureIndex, 1);
    }

    addPricing(serviceIndex: number): void {
        this.settings.services[serviceIndex].pricing = {
            price: 100,
            period: 'month',
            originalPrice: null
        };
    }

    removePricing(serviceIndex: number): void {
        this.settings.services[serviceIndex].pricing = null;
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
