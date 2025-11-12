import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth-service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
    selector: 'app-image-content-editor',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        InputTextarea,
        ButtonModule,
        DropdownModule,
        InputNumberModule,
        CheckboxModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <div class="bg-gray-100 p-4 rounded-lg">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <!-- Image Position Selection -->
                <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Image Position</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            (click)="setImagePosition('left')"
                            [class.active]="form.get('imagePosition')?.value === 'left'"
                            class="position-btn p-3 border-2 rounded-lg transition-all"
                            [class.border-blue-500]="form.get('imagePosition')?.value === 'left'"
                            [class.bg-blue-50]="form.get('imagePosition')?.value === 'left'"
                            [class.border-gray-300]="form.get('imagePosition')?.value !== 'left'"
                        >
                            <div class="flex items-center gap-2 justify-center">
                                <span class="text-2xl">🖼️</span>
                                <span class="text-sm">Left</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            (click)="setImagePosition('right')"
                            [class.active]="form.get('imagePosition')?.value === 'right'"
                            class="position-btn p-3 border-2 rounded-lg transition-all"
                            [class.border-blue-500]="form.get('imagePosition')?.value === 'right'"
                            [class.bg-blue-50]="form.get('imagePosition')?.value === 'right'"
                            [class.border-gray-300]="form.get('imagePosition')?.value !== 'right'"
                        >
                            <div class="flex items-center gap-2 justify-center">
                                <span class="text-sm">Right</span>
                                <span class="text-2xl">🖼️</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            (click)="setImagePosition('above')"
                            [class.active]="form.get('imagePosition')?.value === 'above'"
                            class="position-btn p-3 border-2 rounded-lg transition-all"
                            [class.border-blue-500]="form.get('imagePosition')?.value === 'above'"
                            [class.bg-blue-50]="form.get('imagePosition')?.value === 'above'"
                            [class.border-gray-300]="form.get('imagePosition')?.value !== 'above'"
                        >
                            <div class="flex flex-col items-center gap-2 justify-center">
                                <span class="text-2xl">🖼️</span>
                                <span class="text-sm">Above</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            (click)="setImagePosition('below')"
                            [class.active]="form.get('imagePosition')?.value === 'below'"
                            class="position-btn p-3 border-2 rounded-lg transition-all"
                            [class.border-blue-500]="form.get('imagePosition')?.value === 'below'"
                            [class.bg-blue-50]="form.get('imagePosition')?.value === 'below'"
                            [class.border-gray-300]="form.get('imagePosition')?.value !== 'below'"
                        >
                            <div class="flex flex-col items-center gap-2 justify-center">
                                <span class="text-sm">Below</span>
                                <span class="text-2xl">🖼️</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Image Settings -->
                <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Image Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Image URL Input -->
                        <div class="flex flex-col md:col-span-2">
                            <label for="imageUrl" class="font-medium text-gray-700 mb-2">Image URL</label>
                            <input id="imageUrl" type="url" pInputText formControlName="imageUrl" class="w-full" placeholder="https://example.com/image.jpg" />
                        </div>

                        <!-- Image Preview -->
                        <div class="flex flex-col md:col-span-2" *ngIf="form.get('imageUrl')?.value">
                            <label class="font-medium text-gray-700 mb-2">Image Preview</label>
                            <div class="border border-gray-300 rounded-lg p-4 bg-gray-50 flex justify-center">
                                <img 
                                    [src]="form.get('imageUrl')?.value" 
                                    alt="Image Preview" 
                                    class="max-w-full max-h-64 object-contain rounded"
                                    (error)="onImagePreviewError($event)"
                                />
                            </div>
                        </div>

                        <!-- Image Upload -->
                        <div class="flex flex-col md:col-span-2">
                            <label class="font-medium text-gray-700 mb-2">Or Upload Image</label>
                            <div class="flex gap-2">
                                <input 
                                    #fileInput 
                                    type="file" 
                                    accept="image/*" 
                                    (change)="onImageSelected($event)"
                                    class="hidden"
                                />
                                <button
                                    type="button"
                                    (click)="fileInput.click()"
                                    class="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                    <span class="text-gray-600">📁 Choose Image File</span>
                                </button>
                                <button
                                    type="button"
                                    (click)="uploadImage()"
                                    [disabled]="!selectedFile || isUploading"
                                    class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all"
                                >
                                    {{ isUploading ? 'Uploading...' : 'Upload' }}
                                </button>
                            </div>
                            <p class="text-sm text-gray-500 mt-2" *ngIf="selectedFile">
                                Selected: {{ selectedFile.name }}
                            </p>
                            <p class="text-sm text-gray-500 mt-2" *ngIf="uploadProgress > 0 && uploadProgress < 100">
                                Upload progress: {{ uploadProgress }}%
                            </p>
                        </div>

                        <div class="flex flex-col">
                            <label for="imageBorderRadius" class="font-medium text-gray-700 mb-2">Border Radius (px)</label>
                            <p-inputNumber id="imageBorderRadius" formControlName="imageBorderRadius" class="w-full"></p-inputNumber>
                        </div>

                        <div class="flex items-center gap-3">
                            <p-checkbox
                                id="enableImageShadow"
                                formControlName="enableImageShadow"
                                [binary]="true"
                            ></p-checkbox>
                            <label for="enableImageShadow" class="font-medium text-gray-700 cursor-pointer">Enable Image Shadow</label>
                        </div>

                        <!-- Image Fill Mode -->
                        <div class="flex flex-col md:col-span-2">
                            <label for="imageFillMode" class="font-medium text-gray-700 mb-2">Image Fill Mode</label>
                            <p-dropdown
                                id="imageFillMode"
                                formControlName="imageFillMode"
                                [options]="imageFillModeOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="w-full"
                                placeholder="Select fill mode"
                            ></p-dropdown>
                            <p class="text-xs text-gray-500 mt-2">
                                <span *ngIf="form.get('imageFillMode')?.value === 'none'">Normal sizing with margins/padding</span>
                                <span *ngIf="form.get('imageFillMode')?.value === 'half'">Image fills 50% of the width for left/right layouts</span>
                                <span *ngIf="form.get('imageFillMode')?.value === 'full'">Image fills entire width for above/below layouts</span>
                            </p>
                        </div>

                        <!-- Image Height (for full/above/below) -->
                        <div class="flex flex-col" *ngIf="form.get('imageFillMode')?.value !== 'none'">
                            <label for="imageHeight" class="font-medium text-gray-700 mb-2">Image Height (px)</label>
                            <p-inputNumber 
                                id="imageHeight" 
                                formControlName="imageHeight" 
                                class="w-full"
                                [min]="100"
                                [max]="1000"
                            ></p-inputNumber>
                            <p class="text-xs text-gray-500 mt-1">Height of the image in pixels</p>
                        </div>

                        <!-- Image Width (for half mode with left/right) -->
                        <div class="flex flex-col" *ngIf="form.get('imageFillMode')?.value === 'half'">
                            <label for="imageWidth" class="font-medium text-gray-700 mb-2">Image Width (%)</label>
                            <p-inputNumber 
                                id="imageWidth" 
                                formControlName="imageWidth" 
                                class="w-full"
                                [min]="30"
                                [max]="70"
                                suffix="%"
                            ></p-inputNumber>
                            <p class="text-xs text-gray-500 mt-1">Percentage width for left/right layouts</p>
                        </div>
                    </div>
                </div>

                <p-toast position="top-right"></p-toast>

                <!-- Content Settings -->
                <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Content Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col md:col-span-2">
                            <label for="title" class="font-medium text-gray-700 mb-2">Title</label>
                            <input id="title" type="text" pInputText formControlName="title" class="w-full" />
                        </div>

                        <div class="flex flex-col">
                            <label for="titleColor" class="font-medium text-gray-700 mb-2">Title Color</label>
                            <input id="titleColor" type="color" formControlName="titleColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>

                        <div class="flex flex-col">
                            <label for="titleSize" class="font-medium text-gray-700 mb-2">Title Size (px)</label>
                            <p-inputNumber id="titleSize" formControlName="titleSize" class="w-full"></p-inputNumber>
                        </div>

                        <div class="flex flex-col md:col-span-2">
                            <label for="subtitle" class="font-medium text-gray-700 mb-2">Subtitle (Optional)</label>
                            <input id="subtitle" type="text" pInputText formControlName="subtitle" class="w-full" />
                        </div>

                        <div class="flex flex-col">
                            <label for="subtitleColor" class="font-medium text-gray-700 mb-2">Subtitle Color</label>
                            <input id="subtitleColor" type="color" formControlName="subtitleColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>

                        <div class="flex flex-col">
                            <label for="subtitleSize" class="font-medium text-gray-700 mb-2">Subtitle Size (px)</label>
                            <p-inputNumber id="subtitleSize" formControlName="subtitleSize" class="w-full"></p-inputNumber>
                        </div>

                        <div class="flex flex-col md:col-span-2">
                            <label for="text" class="font-medium text-gray-700 mb-2">Description Text</label>
                            <textarea pInputTextarea formControlName="text" rows="4" class="w-full"></textarea>
                        </div>

                        <div class="flex flex-col">
                            <label for="textColor" class="font-medium text-gray-700 mb-2">Text Color</label>
                            <input id="textColor" type="color" formControlName="textColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>

                        <div class="flex flex-col">
                            <label for="textSize" class="font-medium text-gray-700 mb-2">Text Size (px)</label>
                            <p-inputNumber id="textSize" formControlName="textSize" class="w-full"></p-inputNumber>
                        </div>

                        <div class="flex flex-col">
                            <label for="lineHeight" class="font-medium text-gray-700 mb-2">Line Height</label>
                            <input id="lineHeight" type="text" pInputText formControlName="lineHeight" placeholder="e.g., 1.6" class="w-full" />
                        </div>
                    </div>
                </div>

                <!-- Button Settings -->
                <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Button Settings</h3>
                    <div class="grid grid-cols-1 gap-6">
                        <div class="flex items-center gap-3">
                            <p-checkbox
                                id="showButton"
                                formControlName="showButton"
                                [binary]="true"
                            ></p-checkbox>
                            <label for="showButton" class="font-medium text-gray-700 cursor-pointer">Show Action Button</label>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="flex flex-col">
                                <label for="buttonText" class="font-medium text-gray-700 mb-2">Button Text</label>
                                <input id="buttonText" type="text" pInputText formControlName="buttonText" class="w-full" />
                            </div>

                            <div class="flex flex-col">
                                <label for="buttonLink" class="font-medium text-gray-700 mb-2">Button Link</label>
                                <input id="buttonLink" type="url" pInputText formControlName="buttonLink" class="w-full" />
                            </div>

                            <div class="flex flex-col">
                                <label for="buttonColor" class="font-medium text-gray-700 mb-2">Button Color</label>
                                <input id="buttonColor" type="color" formControlName="buttonColor" class="w-full h-10 rounded-md border-gray-300" />
                            </div>

                            <div class="flex flex-col">
                                <label for="buttonTextColor" class="font-medium text-gray-700 mb-2">Button Text Color</label>
                                <input id="buttonTextColor" type="color" formControlName="buttonTextColor" class="w-full h-10 rounded-md border-gray-300" />
                            </div>

                            <div class="flex flex-col">
                                <label for="buttonTextSize" class="font-medium text-gray-700 mb-2">Button Text Size (px)</label>
                                <p-inputNumber id="buttonTextSize" formControlName="buttonTextSize" class="w-full"></p-inputNumber>
                            </div>

                            <div class="flex flex-col">
                                <label for="buttonPadding" class="font-medium text-gray-700 mb-2">Button Padding</label>
                                <input id="buttonPadding" type="text" pInputText formControlName="buttonPadding" placeholder="e.g., 12px 24px" class="w-full" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Layout Settings -->
                <div class="border border-gray-300 rounded-lg p-4 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Layout Settings</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <label for="backgroundColor" class="font-medium text-gray-700 mb-2">Background Color</label>
                            <input id="backgroundColor" type="color" formControlName="backgroundColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>

                        <div class="flex flex-col">
                            <label for="padding" class="font-medium text-gray-700 mb-2">Padding (px)</label>
                            <p-inputNumber id="padding" formControlName="padding" class="w-full"></p-inputNumber>
                        </div>
                    </div>
                </div>

                <!-- Save Button -->
                <div class="flex justify-end pt-4">
                    <p-button type="submit" label="Save Changes" icon="pi pi-check" severity="success"></p-button>
                </div>
            </form>
        </div>
    `,
    styles: [
        `
            .position-btn {
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;

                &:hover {
                    background-color: #f3f4f6;
                }

                &.active {
                    font-weight: 600;
                }
            }

            textarea {
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                padding: 0.5rem;
                font-family: inherit;
            }
        `
    ]
})
export class ImageContentEditorComponent implements OnChanges {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

    form: FormGroup;
    selectedFile: File | null = null;
    isUploading = false;
    uploadProgress = 0;

    imageFillModeOptions = [
        { label: 'Normal (with margins)', value: 'none' },
        { label: 'Half Width (50% for left/right)', value: 'half' },
        { label: 'Full Width (100% for above/below)', value: 'full' }
    ];

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private authService: AuthService,
        private tenantService: TenantService
    ) {
        this.form = this.fb.group({
            imagePosition: ['left'],
            imageUrl: [''],
            imageBorderRadius: [8],
            enableImageShadow: [true],
            title: ['Section Title'],
            titleColor: ['#000000'],
            titleSize: [32],
            subtitle: [''],
            subtitleColor: ['#333333'],
            subtitleSize: [20],
            text: ['Add your content here. This section combines an image with compelling content, title, subtitle, and a call-to-action button.'],
            textColor: ['#666666'],
            textSize: [16],
            lineHeight: ['1.6'],
            showButton: [true],
            buttonText: ['Learn More'],
            buttonLink: ['#'],
            buttonColor: ['#007bff'],
            buttonTextColor: ['#ffffff'],
            buttonTextSize: [16],
            buttonPadding: ['12px 24px'],
            backgroundColor: ['#ffffff'],
            padding: [40],
            titleMarginBottom: [16],
            subtitleMarginBottom: [12],
            textMarginBottom: [24],
            imageFillMode: ['none'], // none, half, full
            imageHeight: [300], // for full/above/below layouts
            imageWidth: [null], // for left/right layouts (percentage or auto)
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['config'] && this.config) {
            console.log('🔄 ImageContentEditor ngOnChanges triggered');
            console.log('Config received:', this.config);
            console.log('Config.settings:', this.config.settings);
            
            if (this.config.settings) {
                console.log('Patching form with settings:', this.config.settings);
                console.log('ImageUrl value in settings:', this.config.settings.imageUrl);
                
                // Reset form first to clear any cached values
                this.form.reset();
                
                // Then patch with settings
                this.form.patchValue(this.config.settings, { emitEvent: false });
                
                // Log form value after patch to verify
                setTimeout(() => {
                    console.log('Form value after patch:', this.form.value);
                    console.log('Form imageUrl control value:', this.form.get('imageUrl')?.value);
                    console.log('✅ ImageUrl successfully set to:', this.form.get('imageUrl')?.value);
                }, 100);
            } else {
                console.warn('Config has no settings property');
            }
        }
    }

    setImagePosition(position: string) {
        this.form.patchValue({ imagePosition: position });
    }

    onImagePreviewError(event: any) {
        console.error('Image preview failed to load:', event);
        this.messageService.add({
            severity: 'warn',
            summary: 'Image Load Error',
            detail: 'Could not load the image preview. The image URL may be invalid or inaccessible.'
        });
    }

    onImageSelected(event: Event) {
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

            this.selectedFile = file;
            this.messageService.add({
                severity: 'info',
                summary: 'File Selected',
                detail: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
            });
        }
    }

    uploadImage() {
        if (!this.selectedFile) {
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

        this.isUploading = true;
        this.uploadProgress = 0;

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('entityType', 'WidgetImage');

        // Simulate upload with progress
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
            if (event.lengthComputable) {
                this.uploadProgress = Math.round((event.loaded / event.total) * 100);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 201 || xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    // Get the tenant domain for the download URL
                    const tenantId = this.tenantService.getTenantId() || 'host';
                    
                    // Get the uploaded file URL or path with tenant query parameter
                    const imageUrl = response.id ? `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${response.id}?X-Tenant-ID=${tenantId}` : response.filePath;
                    
                    console.log('📤 Upload complete - setting imageUrl:', imageUrl);
                    this.form.patchValue({ imageUrl });
                    
                    // Log immediately after patch
                    console.log('📄 Form imageUrl after patch:', this.form.get('imageUrl')?.value);
                    console.log('📄 Full form value after patch:', this.form.value);
                    
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Upload Successful',
                        detail: 'Image uploaded and set successfully'
                    });
                    
                    this.selectedFile = null;
                    this.uploadProgress = 0;
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
            this.isUploading = false;
        });

        xhr.addEventListener('error', () => {
            this.messageService.add({
                severity: 'error',
                summary: 'Upload Error',
                detail: 'Network error during upload'
            });
            this.isUploading = false;
        });

        // Get the tenant ID to include in the request
        const tenantId = this.tenantService.getTenantId() || 'host';
        
        xhr.open('POST', `${environment.apiUrl}/api/FileUpload/File_UploadFile`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('X-Tenant-ID', tenantId);
        xhr.send(formData);
    }

    onSubmit() {
        if (this.form.valid) {
            this.update.emit(this.form.value);
        }
    }
}
