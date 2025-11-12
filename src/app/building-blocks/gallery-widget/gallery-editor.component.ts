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
import { FileUploadServiceProxy, FileMetadataDto, API_BASE_URL } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-gallery-editor',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, FieldsetModule, FileUploadModule],
    providers: [MessageService, FileUploadServiceProxy, TenantSettingsService],
    template: `
        <div class="bg-gray-100 p-4 rounded-lg">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                        <label for="title" class="font-medium text-gray-700 mb-2">Title</label>
                        <input id="title" type="text" pInputText formControlName="title" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="padding" class="font-medium text-gray-700 mb-2">Padding (px)</label>
                        <input id="padding" type="number" pInputText formControlName="padding" class="w-full" />
                    </div>
                </div>

                <p-fieldset legend="Images" [toggleable]="true">
                    <div formArrayName="images" class="space-y-4">
                        <div *ngFor="let image of images.controls; let i = index" [formGroupName]="i" class="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
                            <img [src]="image.value.src" alt="Preview" class="w-24 h-24 object-cover rounded-lg" />
                            <div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" pInputText formControlName="src" placeholder="Image URL" class="w-full" />
                                <input type="text" pInputText formControlName="alt" placeholder="Alt Text" class="w-full" />
                            </div>
                            <p-button type="button" icon="pi pi-trash" (click)="removeImage(i)" styleClass="p-button-danger p-button-rounded p-button-text"></p-button>
                        </div>
                    </div>
                    <p-fileUpload mode="basic" name="galleryImage" accept="image/*" [maxFileSize]="1000000" (onSelect)="onImageUpload($event)" chooseLabel="Add New Image" class="mt-4"></p-fileUpload>
                </p-fieldset>

                <div class="flex justify-end pt-6">
                    <p-button type="submit" label="Save Changes" icon="pi pi-check"></p-button>
                </div>
            </form>
        </div>
    `
})
export class GalleryEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    form: FormGroup;
    tenantIdHeader!: HttpHeaders;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private fileUploadService: FileUploadServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {
        this.form = this.fb.group({
            title: [''],
            padding: [20],
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
        if (this.config) {
            this.form.patchValue(this.config.settings);
            this.images.clear();
            this.config.settings.images?.forEach((image: any) => {
                this.images.push(this.fb.group(image));
            });
        }
    }

    get images() {
        return this.form.get('images') as FormArray;
    }

    onImageUpload(event: any, index?: number) {
        const file = event.files[0];
        const fileParameter = {
            data: file,
            fileName: file.name
        };
        const tenantId = this.tenantSettingsService.getSettings()?.id;

        if (tenantId) {
            this.fileUploadService.file_UploadFile('GalleryImage', tenantId, undefined, undefined, false, fileParameter).subscribe({
                next: (result: FileMetadataDto) => {
                    const imageUrl = this.getDownloadUrl(result.id);
                    if (index !== undefined) {
                        // Update existing image
                        this.images.at(index).patchValue({ src: imageUrl, alt: file.name });
                    } else {
                        // Add new image
                        this.images.push(this.fb.group({ src: imageUrl, alt: file.name }));
                    }
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Image Uploaded' });
                    this.onSubmit(); // Save changes immediately after upload
                },
                error: (error: any) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload image' });
                    console.error(error);
                }
            });
        } else {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Tenant ID not found for image upload.' });
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
        return `${baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }

    onSubmit() {
        if (this.form.valid) {
            this.update.emit(this.form.value);
        }
    }
}
