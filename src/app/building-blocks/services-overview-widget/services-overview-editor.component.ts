import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-services-overview-editor',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        ColorPickerModule, 
        AccordionModule, 
        DividerModule
    ],
    template: `
        <div class="services-overview-editor p-4">
            <p-accordion [multiple]="true" [activeIndex]="[0]">
                
                <!-- General Settings Tab -->
                <p-accordionTab header="General Settings">
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                            <label for="title" class="form-label fw-semibold">Main Title</label>
                            <input type="text" id="title" [(ngModel)]="settings.title" class="form-control" placeholder="e.g., Our Services" />
                        </div>
                        <div class="col-12 col-md-6">
                            <label for="subtitle" class="form-label fw-semibold">Subtitle</label>
                            <input type="text" id="subtitle" [(ngModel)]="settings.subtitle" class="form-control" placeholder="Optional tagline" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label for="currency" class="form-label fw-semibold">Currency Symbol</label>
                            <input type="text" id="currency" [(ngModel)]="settings.currency" class="form-control" placeholder="R" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label for="featuredBadgeText" class="form-label fw-semibold">Featured Badge Text</label>
                            <input type="text" id="featuredBadgeText" [(ngModel)]="settings.featuredBadgeText" class="form-control" placeholder="Popular" />
                        </div>
                        <div class="col-12 col-md-4">
                            <div class="form-check mt-4">
                                <input type="checkbox" [(ngModel)]="settings.showViewAllButton" class="form-check-input" id="showViewAllButton" />
                                <label class="form-check-label" for="showViewAllButton">Show 'View All' Button</label>
                            </div>
                        </div>
                        <div class="col-12 col-md-6" *ngIf="settings.showViewAllButton">
                            <label for="viewAllButtonText" class="form-label fw-semibold">View All Button Text</label>
                            <input type="text" id="viewAllButtonText" [(ngModel)]="settings.viewAllButtonText" class="form-control" placeholder="View All Services" />
                        </div>
                        <div class="col-12 col-md-6" *ngIf="settings.showViewAllButton">
                            <label for="allServicesUrl" class="form-label fw-semibold">All Services URL</label>
                            <input type="text" id="allServicesUrl" [(ngModel)]="settings.allServicesUrl" class="form-control" placeholder="/services" />
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Colors & Styling Tab -->
                <p-accordionTab header="Colors & Styling">
                    <div class="row g-3">
                        <div class="col-12 col-md-3">
                            <label for="backgroundColor" class="form-label fw-semibold">Background</label>
                            <p-colorPicker id="backgroundColor" [(ngModel)]="settings.backgroundColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="titleColor" class="form-label fw-semibold">Title</label>
                            <p-colorPicker id="titleColor" [(ngModel)]="settings.titleColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="cardBackgroundColor" class="form-label fw-semibold">Card Background</label>
                            <p-colorPicker id="cardBackgroundColor" [(ngModel)]="settings.cardBackgroundColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="iconColor" class="form-label fw-semibold">Icon Color</label>
                            <p-colorPicker id="iconColor" [(ngModel)]="settings.iconColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="serviceTitleColor" class="form-label fw-semibold">Service Title</label>
                            <p-colorPicker id="serviceTitleColor" [(ngModel)]="settings.serviceTitleColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="descriptionColor" class="form-label fw-semibold">Description</label>
                            <p-colorPicker id="descriptionColor" [(ngModel)]="settings.descriptionColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="priceColor" class="form-label fw-semibold">Price</label>
                            <p-colorPicker id="priceColor" [(ngModel)]="settings.priceColor" [inline]="false"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="buttonColor" class="form-label fw-semibold">Button</label>
                            <p-colorPicker id="buttonColor" [(ngModel)]="settings.buttonColor" [inline]="false"></p-colorPicker>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Services Tab -->
                <p-accordionTab [header]="'Services (' + (settings.services?.length || 0) + ')'">
                    <button type="button" class="btn btn-primary mb-3" (click)="addService()">
                        <i class="pi pi-plus me-2"></i>Add Service
                    </button>
                    
                    <p-accordion *ngIf="settings.services && settings.services.length > 0">
                        <p-accordionTab *ngFor="let service of settings.services; let i = index" [header]="service.title || 'Service ' + (i + 1)">
                            <div class="row g-3">
                                
                                <!-- Basic Info Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Basic Information</h5>
                                </div>
                                <div class="col-12">
                                    <label [for]="'serviceTitle' + i" class="form-label fw-semibold">Service Title *</label>
                                    <input type="text" [id]="'serviceTitle' + i" [(ngModel)]="service.title" class="form-control" placeholder="e.g., Funeral Cover" />
                                </div>
                                <div class="col-12">
                                    <label [for]="'serviceDesc' + i" class="form-label fw-semibold">Description</label>
                                    <textarea [id]="'serviceDesc' + i" [(ngModel)]="service.description" class="form-control" rows="3" placeholder="Describe this service"></textarea>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Visual Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Visual Elements</h5>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label [for]="'serviceIcon' + i" class="form-label fw-semibold">Icon Class</label>
                                    <input type="text" [id]="'serviceIcon' + i" [(ngModel)]="service.icon" class="form-control" placeholder="pi pi-heart" />
                                    <small class="text-muted">PrimeIcons: pi pi-[name]</small>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label [for]="'serviceImage' + i" class="form-label fw-semibold">Image URL (optional)</label>
                                    <input type="text" [id]="'serviceImage' + i" [(ngModel)]="service.imageUrl" class="form-control" placeholder="https://..." />
                                </div>
                                <div class="col-12">
                                    <div class="form-check">
                                        <input type="checkbox" [(ngModel)]="service.featured" class="form-check-input" [id]="'serviceFeatured' + i" />
                                        <label class="form-check-label" [for]="'serviceFeatured' + i">Mark as Featured (shows badge)</label>
                                    </div>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Features Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-2">Features List</h5>
                                    <button type="button" class="btn btn-sm btn-success mb-2" (click)="addFeature(i)">
                                        <i class="pi pi-plus me-1"></i>Add Feature
                                    </button>
                                </div>
                                <div class="col-12" *ngFor="let feature of service.features; let j = index">
                                    <div class="input-group mb-2">
                                        <span class="input-group-text"><i class="pi pi-check-circle text-success"></i></span>
                                        <input type="text" [(ngModel)]="service.features[j]" class="form-control" placeholder="Feature description" />
                                        <button type="button" class="btn btn-outline-danger" (click)="removeFeature(i, j)">
                                            <i class="pi pi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Pricing Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Pricing (Optional)</h5>
                                    <div class="form-check">
                                        <input type="checkbox" [ngModel]="service.pricing !== null && service.pricing !== undefined" (ngModelChange)="service.pricing ? removePricing(i) : addPricing(i)" class="form-check-input" [id]="'servicePricing' + i" />
                                        <label class="form-check-label" [for]="'servicePricing' + i">Include Pricing Information</label>
                                    </div>
                                </div>
                                <div *ngIf="service.pricing" class="col-12">
                                    <div class="row g-3">
                                        <div class="col-12 col-md-4">
                                            <label [for]="'servicePrice' + i" class="form-label fw-semibold">Price</label>
                                            <input type="text" [id]="'servicePrice' + i" [(ngModel)]="service.pricing.price" class="form-control" placeholder="2999" />
                                        </div>
                                        <div class="col-12 col-md-4">
                                            <label [for]="'servicePeriod' + i" class="form-label fw-semibold">Period</label>
                                            <input type="text" [id]="'servicePeriod' + i" [(ngModel)]="service.pricing.period" class="form-control" placeholder="/month" />
                                        </div>
                                        <div class="col-12 col-md-4">
                                            <label [for]="'serviceOrigPrice' + i" class="form-label fw-semibold">Original Price (strikethrough)</label>
                                            <input type="text" [id]="'serviceOrigPrice' + i" [(ngModel)]="service.pricing.originalPrice" class="form-control" placeholder="3499" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- CTA Button Section -->
                                <div class="col-12">
                                    <h5 class="text-primary mb-3">Call-to-Action Button</h5>
                                </div>
                                <div class="col-12 col-md-6">
                                    <label [for]="'serviceButtonText' + i" class="form-label fw-semibold">Button Text</label>
                                    <input type="text" [id]="'serviceButtonText' + i" [(ngModel)]="service.buttonText" class="form-control" placeholder="Learn More" />
                                </div>
                                <div class="col-12 col-md-6">
                                    <label [for]="'serviceButtonLink' + i" class="form-label fw-semibold">Button Link</label>
                                    <input type="text" [id]="'serviceButtonLink' + i" [(ngModel)]="service.buttonLink" class="form-control" placeholder="/contact" />
                                </div>
                                
                                <div class="col-12"><p-divider></p-divider></div>
                                
                                <!-- Remove Service -->
                                <div class="col-12 d-flex justify-content-end">
                                    <button type="button" class="btn btn-outline-danger" (click)="removeService(i)">
                                        <i class="pi pi-trash me-2"></i>Remove Service
                                    </button>
                                </div>
                            </div>
                        </p-accordionTab>
                    </p-accordion>
                    
                    <div *ngIf="!settings.services || settings.services.length === 0" class="text-center py-4 text-muted">
                        <i class="pi pi-inbox" style="font-size: 3rem;"></i>
                        <p class="mt-3">No services added yet. Click "Add Service" to get started.</p>
                    </div>
                </p-accordionTab>
                
            </p-accordion>

            <div class="mt-4 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancel</button>
                <button type="button" class="btn btn-success" (click)="updateWidget()">
                    <i class="pi pi-check me-2"></i>Update Widget
                </button>
            </div>
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
    @Output() cancel = new EventEmitter<void>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            // Deep copy to avoid mutating the original config
            this.settings = JSON.parse(JSON.stringify(this.config.settings));
            
            // Ensure services array exists
            if (!this.settings.services) {
                this.settings.services = [];
            }
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
            price: '100',
            period: '/month',
            originalPrice: null
        };
    }

    removePricing(serviceIndex: number): void {
        this.settings.services[serviceIndex].pricing = null;
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
