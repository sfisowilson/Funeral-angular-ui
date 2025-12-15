import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadServiceProxy, FileMetadataDto, FileParameter } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-about-us-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputTextarea, ButtonModule, FileUploadModule, 
              ToastModule, AccordionModule, CheckboxModule],
    providers: [MessageService, FileUploadServiceProxy, TenantSettingsService],
    templateUrl: './about-us-editor.component.html',
    styleUrls: ['./about-us-editor.component.scss']
})
export class AboutUsEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    tenantIdHeader!: HttpHeaders;
    originalSettings: any;

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

        // Initialize settings with default structure
        if (!this.config.settings.padding) this.config.settings.padding = 60;
        if (!this.config.settings.values) this.config.settings.values = [];
        if (!this.config.settings.stats) this.config.settings.stats = [];
        if (!this.config.settings.teamMembers) this.config.settings.teamMembers = [];
        if (!this.config.settings.ctaPrimaryButton) this.config.settings.ctaPrimaryButton = { text: '', link: '' };
        if (!this.config.settings.ctaSecondaryButton) this.config.settings.ctaSecondaryButton = { text: '', link: '' };
        
        // Store original settings for cancel functionality
        this.originalSettings = JSON.parse(JSON.stringify(this.config.settings));
    }

    // Upload handlers
    onHeroImageUpload(event: any) {
        this.uploadImage(event, 'HeroImage', (fileId) => {
            this.config.settings.heroImage = fileId;
        });
    }

    onStoryImageUpload(event: any) {
        this.uploadImage(event, 'StoryImage', (fileId) => {
            this.config.settings.storyImage = fileId;
        });
    }

    onTeamMemberImageUpload(event: any, index: number) {
        this.uploadImage(event, 'TeamMemberPhoto', (fileId) => {
            this.config.settings.teamMembers[index].image = fileId;
        });
    }

    private uploadImage(event: any, category: string, onSuccess: (fileId: string) => void) {
        const file = event.files[0];
        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };

        // Use undefined for entityId (widget uploads don't need entityId)
        this.fileUploadService.file_UploadFile(category, undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (result: FileMetadataDto) => {
                onSuccess(result.id!);
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Image Uploaded' });
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload image' });
                console.error(error);
            }
        });
    }

    // Values management
    addValue() {
        if (!this.config.settings.values) {
            this.config.settings.values = [];
        }
        this.config.settings.values.push({
            icon: 'pi pi-check-circle',
            title: '',
            description: ''
        });
    }

    removeValue(index: number) {
        this.config.settings.values.splice(index, 1);
    }

    // Stats management
    addStat() {
        if (!this.config.settings.stats) {
            this.config.settings.stats = [];
        }
        this.config.settings.stats.push({
            number: '',
            label: ''
        });
    }

    removeStat(index: number) {
        this.config.settings.stats.splice(index, 1);
    }

    // Team management
    addTeamMember() {
        if (!this.config.settings.teamMembers) {
            this.config.settings.teamMembers = [];
        }
        this.config.settings.teamMembers.push({
            name: '',
            role: '',
            bio: '',
            image: '',
            linkedin: '',
            twitter: ''
        });
    }

    removeTeamMember(index: number) {
        this.config.settings.teamMembers.splice(index, 1);
    }

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        const baseUrl = this.tenantSettingsService.getBaseUrl();
        return `${baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }

    onSubmit() {
        // Emit the updated settings
        this.update.emit(this.config.settings);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'About Us widget saved successfully' });
    }

    onCancel() {
        // Restore original settings
        this.config.settings = JSON.parse(JSON.stringify(this.originalSettings));
        this.messageService.add({ severity: 'info', summary: 'Cancelled', detail: 'Changes discarded' });
    }
}
