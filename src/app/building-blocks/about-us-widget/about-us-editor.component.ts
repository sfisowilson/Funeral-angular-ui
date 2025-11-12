import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FileUploadServiceProxy, FileMetadataDto } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-about-us-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputTextarea, ButtonModule, FileUploadModule, ToastModule],
    providers: [MessageService, FileUploadServiceProxy, TenantSettingsService],
    templateUrl: './about-us-editor.component.html',
    styleUrls: ['./about-us-editor.component.scss']
})
export class AboutUsEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    tenantIdHeader!: HttpHeaders;

    constructor(
        private messageService: MessageService,
        private fileUploadService: FileUploadServiceProxy,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit(): void {
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www') {
            this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', subdomain);
        }
    }

    onImageUpload(event: any) {
        const file = event.files[0];
        const fileParameter = {
            data: file,
            fileName: file.name
        };
        // Assuming entityId is the tenant ID, similar to logo upload
        const tenantId = this.tenantSettingsService.getSettings()?.id;

        if (tenantId) {
            this.fileUploadService.file_UploadFile('AboutUsImage', tenantId, undefined, undefined, false, fileParameter).subscribe({
                next: (result: FileMetadataDto) => {
                    this.config.settings.imageUrl = result.id;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Image Uploaded' });
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

    removeImage(): void {
        this.config.settings.imageUrl = null;
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Image Removed' });
    }

    get imageUrl(): string | null {
        return this.config.settings.imageUrl || null;
    }

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        const baseUrl = this.tenantSettingsService.getBaseUrl();
        // Assuming tenantId is not directly available here, or handled by backend
        return `${baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }
}
