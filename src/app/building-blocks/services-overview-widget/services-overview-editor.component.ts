import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth-service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
    selector: 'app-services-overview-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ColorPickerModule,
        AccordionModule,
        DividerModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
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
                            <p-colorPicker id="backgroundColor" [(ngModel)]="settings.backgroundColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="titleColor" class="form-label fw-semibold">Title</label>
                            <p-colorPicker id="titleColor" [(ngModel)]="settings.titleColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="cardBackgroundColor" class="form-label fw-semibold">Card Background</label>
                            <p-colorPicker id="cardBackgroundColor" [(ngModel)]="settings.cardBackgroundColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="iconColor" class="form-label fw-semibold">Icon Color</label>
                            <p-colorPicker id="iconColor" [(ngModel)]="settings.iconColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="serviceTitleColor" class="form-label fw-semibold">Service Title</label>
                            <p-colorPicker id="serviceTitleColor" [(ngModel)]="settings.serviceTitleColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="descriptionColor" class="form-label fw-semibold">Description</label>
                            <p-colorPicker id="descriptionColor" [(ngModel)]="settings.descriptionColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="priceColor" class="form-label fw-semibold">Price</label>
                            <p-colorPicker id="priceColor" [(ngModel)]="settings.priceColor" [inline]="false" appendTo="body"></p-colorPicker>
                        </div>
                        <div class="col-12 col-md-3">
                            <label for="buttonColor" class="form-label fw-semibold">Button</label>
                            <p-colorPicker id="buttonColor" [(ngModel)]="settings.buttonColor" [inline]="false" appendTo="body"></p-colorPicker>
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
                                    <label class="form-label fw-semibold">Service Image</label>
                                    <div class="d-flex gap-2 mb-2">
                                        <input 
                                            [id]="'fileInput' + i"
                                            type="file" 
                                            accept="image/*" 
                                            (change)="onImageSelected($event, i)"
                                            class="d-none"
                                        />
                                        <button
                                            type="button"
                                            (click)="triggerFileInput(i)"
                                            class="btn btn-outline-secondary flex-fill"
                                        >
                                            <i class="pi pi-upload me-2"></i>Choose Image
                                        </button>
                                        <button
                                            type="button"
                                            (click)="uploadServiceImage(i)"
                                            [disabled]="!selectedFiles[i] || uploadingServices[i]"
                                            class="btn btn-primary"
                                        >
                                            {{ uploadingServices[i] ? 'Uploading...' : 'Upload' }}
                                        </button>
                                    </div>
                                    <input type="text" [id]="'serviceImage' + i" [(ngModel)]="service.imageUrl" class="form-control" placeholder="Or enter image URL" />
                                    <small class="text-muted d-block mt-1" *ngIf="selectedFiles[i]">
                                        Selected: {{ selectedFiles[i]?.name }}
                                    </small>
                                    <small class="text-muted d-block mt-1" *ngIf="uploadProgress[i] > 0 && uploadProgress[i] < 100">
                                        Upload progress: {{ uploadProgress[i] }}%
                                    </small>
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
        
        /* Fix color picker z-index to prevent it from being cut off */
        :host ::ng-deep .p-colorpicker-panel {
            z-index: 9999 !important;
        }
        
        :host ::ng-deep .p-colorpicker-overlay {
            z-index: 9999 !important;
        }
    `]
})
export class ServicesOverviewEditorComponent implements OnChanges {
    @Input() config: any;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    settings: any = {};
    
    // Image upload properties
    selectedFiles: { [key: number]: File | null } = {};
    uploadingServices: { [key: number]: boolean } = {};
    uploadProgress: { [key: number]: number } = {};

    constructor(
        private messageService: MessageService,
        private authService: AuthService,
        private tenantService: TenantService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        console.log('=== SERVICES EDITOR ngOnChanges FIRED ===');
        console.log('changes:', changes);
        console.log('this.config:', this.config);
        
        if (changes['config'] && this.config) {
            console.log('Config exists, checking settings...');
            console.log('this.config.settings:', this.config.settings);
            
            if (this.config.settings) {
                // Always reload when config changes - deep copy to avoid mutating the original
                this.settings = JSON.parse(JSON.stringify(this.config.settings));
                
                console.log('Settings after deep copy:', this.settings);
                console.log('Services in settings:', this.settings.services);
                
                // Ensure services array exists
                if (!this.settings.services) {
                    console.warn('No services array found, initializing empty array');
                    this.settings.services = [];
                }
                
                console.log('Final services count:', this.settings.services?.length || 0);
                console.log('Final settings object:', this.settings);
            } else {
                console.error('NO SETTINGS FOUND IN CONFIG!');
            }
        } else {
            console.log('Config change not detected or config is null');
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

    // Image upload methods
    triggerFileInput(serviceIndex: number): void {
        const fileInput = document.getElementById(`fileInput${serviceIndex}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onImageSelected(event: Event, serviceIndex: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Invalid File',
                    detail: 'Please select a valid image file (JPG, PNG, GIF, WebP, etc.)'
                });
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'File Too Large',
                    detail: 'Maximum file size is 5MB'
                });
                return;
            }

            this.selectedFiles[serviceIndex] = file;
            this.messageService.add({
                severity: 'info',
                summary: 'File Selected',
                detail: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
            });
        }
    }

    uploadServiceImage(serviceIndex: number): void {
        const selectedFile = this.selectedFiles[serviceIndex];
        
        if (!selectedFile) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No File',
                detail: 'Please select an image file first'
            });
            return;
        }

        // Check if user is authenticated
        const token = this.authService.getToken();
        if (!token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Not Authenticated',
                detail: 'Please log in to upload files'
            });
            return;
        }

        this.uploadingServices[serviceIndex] = true;
        this.uploadProgress[serviceIndex] = 0;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('entityType', 'ServiceImage');

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
            if (event.lengthComputable) {
                this.uploadProgress[serviceIndex] = Math.round((event.loaded / event.total) * 100);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 201 || xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    // Get the tenant domain for the download URL
                    const tenantId = this.tenantService.getTenantId() || 'host';
                    
                    // Get the uploaded file URL or path with tenant query parameter
                    const imageUrl = response.id 
                        ? `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${response.id}?X-Tenant-ID=${tenantId}` 
                        : response.filePath;
                    
                    console.log('Service image upload complete:', imageUrl);
                    
                    // Set the image URL for this service
                    this.settings.services[serviceIndex].imageUrl = imageUrl;
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Upload Successful',
                        detail: 'Service image uploaded successfully'
                    });
                    
                    this.selectedFiles[serviceIndex] = null;
                    this.uploadProgress[serviceIndex] = 0;
                } catch (error) {
                    console.error('Error parsing upload response:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to process upload response'
                    });
                }
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Upload Failed',
                    detail: `Server returned status ${xhr.status}`
                });
            }
            this.uploadingServices[serviceIndex] = false;
        });

        xhr.addEventListener('error', () => {
            this.messageService.add({
                severity: 'error',
                summary: 'Upload Error',
                detail: 'Network error occurred during upload'
            });
            this.uploadingServices[serviceIndex] = false;
        });

        xhr.open('POST', `${environment.apiUrl}/api/FileUpload/File_UploadFile`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        const tenantId = this.tenantService.getTenantId();
        if (tenantId) {
            xhr.setRequestHeader('X-Tenant-ID', tenantId);
        }
        
        xhr.send(formData);
    }
}
