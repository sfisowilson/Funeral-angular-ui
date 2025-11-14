import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { InputTextarea } from 'primeng/inputtextarea';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-services-overview-editor',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        InputTextModule, 
        ColorPickerModule, 
        InputNumberModule, 
        ButtonModule, 
        CheckboxModule, 
        AccordionModule, 
        InputTextarea, 
        DividerModule
    ],
    template: `
        <div class="services-overview-editor p-4">
            <p-accordion [multiple]="true" [activeIndex]="[0]">
                
                <!-- General Settings Tab -->
                <p-accordionTab header="General Settings">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="title" class="block mb-2 font-semibold">Main Title</label>
                            <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" placeholder="e.g., Our Services" />
                        </div>
                        <div class="col-12 md:col-6">
                            <label for="subtitle" class="block mb-2 font-semibold">Subtitle</label>
                            <input pInputText id="subtitle" [(ngModel)]="settings.subtitle" class="w-full" placeholder="Optional tagline" />
                        </div>
                        <div class="col-12 md:col-4">
                            <label for="currency" class="block mb-2 font-semibold">Currency Symbol</label>
                            <input pInputText id="currency" [(ngModel)]="settings.currency" class="w-full" placeholder="R" />
                        </div>
                        <div class="col-12 md:col-4">
                            <label for="featuredBadgeText" class="block mb-2 font-semibold">Featured Badge Text</label>
                            <input pInputText id="featuredBadgeText" [(ngModel)]="settings.featuredBadgeText" class="w-full" placeholder="Popular" />
                        </div>
                        <div class="col-12 md:col-4">
                            <p-checkbox [(ngModel)]="settings.showViewAllButton" [binary]="true" label="Show 'View All' Button" styleClass="mt-4"></p-checkbox>
                        </div>
                        <div class="col-12 md:col-6" *ngIf="settings.showViewAllButton">
                            <label for="viewAllButtonText" class="block mb-2 font-semibold">View All Button Text</label>
                            <input pInputText id="viewAllButtonText" [(ngModel)]="settings.viewAllButtonText" class="w-full" placeholder="View All Services" />
                        </div>
                        <div class="col-12 md:col-6" *ngIf="settings.showViewAllButton">
                            <label for="allServicesUrl" class="block mb-2 font-semibold">All Services URL</label>
                            <input pInputText id="allServicesUrl" [(ngModel)]="settings.allServicesUrl" class="w-full" placeholder="/services" />
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Colors & Styling Tab -->
                <p-accordionTab header="Colors & Styling">
                    <div class="grid">
                        <div class="col-12 md:col-3">
                            <label for="backgroundColor" class="block mb-2 font-semibold">Background</label>
                            <p-colorPicker id="backgroundColor" [(ngModel)]="settings.backgroundColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="titleColor" class="block mb-2 font-semibold">Title</label>
                            <p-colorPicker id="titleColor" [(ngModel)]="settings.titleColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="cardBackgroundColor" class="block mb-2 font-semibold">Card Background</label>
                            <p-colorPicker id="cardBackgroundColor" [(ngModel)]="settings.cardBackgroundColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="iconColor" class="block mb-2 font-semibold">Icon Color</label>
                            <p-colorPicker id="iconColor" [(ngModel)]="settings.iconColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="serviceTitleColor" class="block mb-2 font-semibold">Service Title</label>
                            <p-colorPicker id="serviceTitleColor" [(ngModel)]="settings.serviceTitleColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="descriptionColor" class="block mb-2 font-semibold">Description</label>
                            <p-colorPicker id="descriptionColor" [(ngModel)]="settings.descriptionColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="priceColor" class="block mb-2 font-semibold">Price</label>
                            <p-colorPicker id="priceColor" [(ngModel)]="settings.priceColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 md:col-3">
                            <label for="buttonColor" class="block mb-2 font-semibold">Button</label>
                            <p-colorPicker id="buttonColor" [(ngModel)]="settings.buttonColor" [inline]="false"></p-colorPicker>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Services Tab -->
                <p-accordionTab [header]="'Services (' + (settings.services?.length || 0) + ')'">
                    <button pButton type="button" label="Add Service" icon="pi pi-plus" (click)="addService()" class="mb-3"></button>
                    
                    <p-accordion *ngIf="settings.services && settings.services.length > 0">
                        <p-accordionTab *ngFor="let service of settings.services; let i = index" [header]="service.title || 'Service ' + (i + 1)">
                            <div class="grid">
                                
                                <!-- Basic Info Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Basic Information</h5>
                                </div>
                                <div class="col-12">
                                    <label [for]="'serviceTitle' + i" class="block mb-2 font-semibold">Service Title *</label>
                                    <input pInputText [id]="'serviceTitle' + i" [(ngModel)]="service.title" class="w-full" placeholder="e.g., Funeral Cover" />
                                </div>
                                <div class="col-12">
                                    <label [for]="'serviceDesc' + i" class="block mb-2 font-semibold">Description</label>
                                    <textarea pInputTextarea [id]="'serviceDesc' + i" [(ngModel)]="service.description" class="w-full" rows="3" placeholder="Describe this service"></textarea>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Visual Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Visual Elements</h5>
                                </div>
                                <div class="col-12 md:col-6">
                                    <label [for]="'serviceIcon' + i" class="block mb-2 font-semibold">Icon Class</label>
                                    <input pInputText [id]="'serviceIcon' + i" [(ngModel)]="service.icon" class="w-full" placeholder="pi pi-heart" />
                                    <small class="text-500">PrimeIcons: pi pi-[name]</small>
                                </div>
                                <div class="col-12 md:col-6">
                                    <label [for]="'serviceImage' + i" class="block mb-2 font-semibold">Image URL (optional)</label>
                                    <input pInputText [id]="'serviceImage' + i" [(ngModel)]="service.imageUrl" class="w-full" placeholder="https://..." />
                                </div>
                                <div class="col-12">
                                    <p-checkbox [(ngModel)]="service.featured" [binary]="true" label="Mark as Featured (shows badge)"></p-checkbox>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Features Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-2">Features List</h5>
                                    <button pButton type="button" label="Add Feature" icon="pi pi-plus" (click)="addFeature(i)" class="mb-2 p-button-sm"></button>
                                </div>
                                <div class="col-12" *ngFor="let feature of service.features; let j = index">
                                    <div class="flex mb-2 align-items-center">
                                        <i class="pi pi-check-circle text-green-500 mr-2"></i>
                                        <input pInputText [(ngModel)]="service.features[j]" class="flex-grow-1 mr-2" placeholder="Feature description" />
                                        <button pButton type="button" icon="pi pi-trash" class="p-button-danger p-button-text p-button-sm" (click)="removeFeature(i, j)"></button>
                                    </div>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Pricing Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Pricing (Optional)</h5>
                                    <p-checkbox [ngModel]="service.pricing !== null && service.pricing !== undefined" (ngModelChange)="service.pricing ? removePricing(i) : addPricing(i)" [binary]="true" label="Include Pricing Information"></p-checkbox>
                                </div>
                                <div *ngIf="service.pricing" class="col-12 grid">
                                    <div class="col-12 md:col-4">
                                        <label [for]="'servicePrice' + i" class="block mb-2 font-semibold">Price</label>
                                        <input pInputText [id]="'servicePrice' + i" [(ngModel)]="service.pricing.price" class="w-full" placeholder="2999" />
                                    </div>
                                    <div class="col-12 md:col-4">
                                        <label [for]="'servicePeriod' + i" class="block mb-2 font-semibold">Period</label>
                                        <input pInputText [id]="'servicePeriod' + i" [(ngModel)]="service.pricing.period" class="w-full" placeholder="/month" />
                                    </div>
                                    <div class="col-12 md:col-4">
                                        <label [for]="'serviceOrigPrice' + i" class="block mb-2 font-semibold">Original Price (strikethrough)</label>
                                        <input pInputText [id]="'serviceOrigPrice' + i" [(ngModel)]="service.pricing.originalPrice" class="w-full" placeholder="3499" />
                                    </div>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- CTA Button Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Call-to-Action Button</h5>
                                </div>
                                <div class="col-12 md:col-6">
                                    <label [for]="'serviceButtonText' + i" class="block mb-2 font-semibold">Button Text</label>
                                    <input pInputText [id]="'serviceButtonText' + i" [(ngModel)]="service.buttonText" class="w-full" placeholder="Learn More" />
                                </div>
                                <div class="col-12 md:col-6">
                                    <label [for]="'serviceButtonLink' + i" class="block mb-2 font-semibold">Button Link</label>
                                    <input pInputText [id]="'serviceButtonLink' + i" [(ngModel)]="service.buttonLink" class="w-full" placeholder="/contact" />
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Remove Service -->
                                <div class="col-12 flex justify-content-end">
                                    <button pButton type="button" label="Remove Service" icon="pi pi-trash" class="p-button-danger p-button-outlined" (click)="removeService(i)"></button>
                                </div>
                            </div>
                        </p-accordionTab>
                    </p-accordion>
                    
                    <div *ngIf="!settings.services || settings.services.length === 0" class="text-center py-4 text-500">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        <p>No services added yet. Click "Add Service" to get started.</p>
                    </div>
                </p-accordionTab>
                
            </p-accordion>
        </div>
    `,
    styles: [`
        .services-overview-editor :host ::ng-deep .p-accordion-header {
            font-weight: 600;
        }
    `]
})
export class ServicesOverviewEditorComponent implements OnChanges {
    @Input() config: any;
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
        this.updateWidget();
    }

    removeService(index: number): void {
        this.settings.services.splice(index, 1);
        this.updateWidget();
    }

    addFeature(serviceIndex: number): void {
        if (!this.settings.services[serviceIndex].features) {
            this.settings.services[serviceIndex].features = [];
        }
        this.settings.services[serviceIndex].features.push('New Feature');
        this.updateWidget();
    }

    removeFeature(serviceIndex: number, featureIndex: number): void {
        this.settings.services[serviceIndex].features.splice(featureIndex, 1);
        this.updateWidget();
    }

    addPricing(serviceIndex: number): void {
        this.settings.services[serviceIndex].pricing = {
            price: '100',
            period: '/month',
            originalPrice: null
        };
        this.updateWidget();
    }

    removePricing(serviceIndex: number): void {
        this.settings.services[serviceIndex].pricing = null;
        this.updateWidget();
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
