import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { FileUploadServiceProxy, FileMetadataDto, API_BASE_URL } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantService } from '../../core/services/tenant.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-gallery-editor',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, FieldsetModule, FileUploadModule, DropdownModule, InputSwitchModule, ToastModule],
    providers: [MessageService, FileUploadServiceProxy, TenantSettingsService],
    templateUrl: './gallery-editor.component.html'
})
export class GalleryEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    form: FormGroup;
    tenantIdHeader!: HttpHeaders;

    layoutOptions = [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' }
    ];

    columnOptions = [
        { label: '2 Columns', value: 2 },
        { label: '3 Columns', value: 3 },
        { label: '4 Columns', value: 4 },
        { label: '5 Columns', value: 5 }
    ];

    get settings(): any {
        if (!this.config.settings) {
            this.config.settings = {};
        }
        return this.config.settings;
    }

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private fileUploadService: FileUploadServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        private tenantService: TenantService,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {
        this.form = this.fb.group({
            title: ['Gallery'],
            padding: [20],
            layout: ['grid'],
            columns: [3],
            gap: [16],
            showTitles: [true],
            enableLightbox: [true],
            roundedCorners: [true],
            hoverEffect: [true],
            images: this.fb.array([])
        });
    }

    ngOnInit(): void {
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www') {
            this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', subdomain);
        }
    }

    ngOnChanges() {
        if (this.config && this.config.settings) {
            this.form.patchValue({
                title: this.settings.title || 'Gallery',
                padding: this.settings.padding || 20,
                layout: this.settings.layout || 'grid',
                columns: this.settings.columns || 3,
                gap: this.settings.gap || 16,
                showTitles: this.settings.showTitles !== false,
                enableLightbox: this.settings.enableLightbox !== false,
                roundedCorners: this.settings.roundedCorners !== false,
                hoverEffect: this.settings.hoverEffect !== false
            });
            this.images.clear();
            this.settings.images?.forEach((image: any) => {
                this.images.push(this.fb.group({
                    src: [image.src || ''],
                    alt: [image.alt || ''],
                    title: [image.title || '']
                }));
            });
        }
    }

    get images() {
        return this.form.get('images') as FormArray;
    }

    onFileSelect(event: any, index?: number) {
        console.log('🎯 onFileSelect triggered!', event);
        const input = event.target as HTMLInputElement;
        console.log('📁 Input element:', input);
        const files = input.files;
        console.log('📂 Files object:', files);
        
        if (!files || files.length === 0) {
            console.log('❌ No files selected');
            this.messageService.add({ severity: 'warn', summary: 'No Files', detail: 'No files were selected' });
            return;
        }

        console.log(`Processing ${files.length} files`);
        this.messageService.add({ 
            severity: 'info', 
            summary: 'Processing', 
            detail: `Processing ${files.length} image${files.length > 1 ? 's' : ''}...` 
        });

        // If replacing a specific image
        if (index !== undefined) {
            const file = files[0];
            console.log('Replacing image at index', index, file.name);
            
            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.images.at(index).patchValue({ 
                    src: e.target.result,
                    alt: file.name,
                    title: this.images.at(index).value.title || file.name
                });
            };
            reader.readAsDataURL(file);

            // Upload file
            const fileParameter = { data: file, fileName: file.name };
            this.fileUploadService.file_UploadFile('GalleryImage', undefined, undefined, undefined, false, fileParameter).subscribe({
                next: (result: FileMetadataDto) => {
                    const imageUrl = this.getDownloadUrl(result.id);
                    this.images.at(index).patchValue({ src: imageUrl });
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Image replaced' });
                    // Clear input
                    input.value = '';
                },
                error: (error: any) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload image' });
                    console.error(error);
                    input.value = '';
                }
            });
        } else {
            // Multiple file upload - add placeholders first, then load previews
            let uploadedCount = 0;
            const totalFiles = files.length;
            const startingIndex = this.images.length;

            console.log('Adding multiple images starting at index', startingIndex);

            // Process each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                console.log(`Processing image ${i + 1}:`, file.name);
                
                // Add placeholder
                const imageIndex = this.images.length;
                this.images.push(this.fb.group({ 
                    src: ['https://via.placeholder.com/400x300?text=Uploading...'], 
                    alt: [file.name],
                    title: [file.name]
                }));
                
                // Show preview
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    console.log(`Preview loaded for image ${i + 1}`);
                    this.images.at(imageIndex).patchValue({ src: e.target.result });
                };
                reader.readAsDataURL(file);

                // Upload file
                const fileParameter = { data: file, fileName: file.name };
                this.fileUploadService.file_UploadFile('GalleryImage', undefined, undefined, undefined, false, fileParameter).subscribe({
                    next: (result: FileMetadataDto) => {
                        console.log(`Upload complete for image ${i + 1}`, result.id);
                        const imageUrl = this.getDownloadUrl(result.id);
                        this.images.at(imageIndex).patchValue({ src: imageUrl });
                        uploadedCount++;
                        
                        if (uploadedCount === totalFiles) {
                            this.messageService.add({ 
                                severity: 'success', 
                                summary: 'Success', 
                                detail: `${totalFiles} image${totalFiles > 1 ? 's' : ''} uploaded successfully` 
                            });
                            // Clear input
                            input.value = '';
                        }
                    },
                    error: (error: any) => {
                        this.messageService.add({ 
                            severity: 'error', 
                            summary: 'Error', 
                            detail: `Failed to upload ${file.name}` 
                        });
                        console.error(error);
                        uploadedCount++;
                        
                        if (uploadedCount === totalFiles) {
                            this.onSubmit();
                            // Clear input
                            input.value = '';
                        }
                    }
                });
            }
        }
    }

    removeImage(index: number) {
        this.images.removeAt(index);
        this.onSubmit(); // Save changes immediately after removal
    }

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        const baseUrl = this.tenantSettingsService.getBaseUrl();
        const tenantId = this.tenantService.getTenantId() || 'host';
        return `${baseUrl}/api/FileUpload/File_DownloadFile/${fileId}?X-Tenant-ID=${tenantId}`;
    }

    onSubmit() {
        if (this.form.valid) {
            this.update.emit(this.form.value);
        }
    }

    onSave() {
        this.update.emit(this.config.settings);
    }
}
