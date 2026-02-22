import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FileUploadServiceProxy, FileMetadataDto } from '@app/core/services/service-proxies';
import { firstValueFrom } from 'rxjs';

export interface FileUploadConfig {
    label?: string;
    helpText?: string;
    allowMultiple?: boolean;
    maxFiles?: number;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    documentType?: string;
    required?: boolean;
}

export interface UploadedFile {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadDate: Date;
    description?: string;
}

@Component({
    selector: 'app-dynamic-file-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, ProgressBarModule, TooltipModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="dynamic-file-upload">
            <!-- Header and Instructions -->
            <div class="upload-header">
                <label class="field-label">
                    {{ config().label || 'File Upload' }}
                    <span *ngIf="config().required" class="required-asterisk">*</span>
                </label>
                <p *ngIf="config().helpText" class="help-text">
                    {{ config().helpText }}
                </p>
                <div class="upload-info">
                    <small>
                        <i class="pi pi-info-circle"></i>
                        Max size: {{ config().maxSizeMB || 5 }}MB per file
                        <span *ngIf="config().allowMultiple && config().maxFiles"> | Max {{ config().maxFiles }} files </span>
                    </small>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingFiles()" class="text-center p-4">
                <p-progressBar mode="indeterminate" [style]="{ height: '6px' }"></p-progressBar>
                <small class="d-block mt-2 text-muted">Loading files...</small>
            </div>

            <!-- Upload Section -->
            <div *ngIf="!isMaxFilesReached() && !loadingFiles()" class="upload-section">
                <input #fileInput type="file" [multiple]="config().allowMultiple" [accept]="getAcceptedTypes()" (change)="onFileSelect($event)" style="display: none" />

                <button
                    pButton
                    type="button"
                    [label]="uploadedFiles().length > 0 ? (config().allowMultiple ? 'Choose More Files' : 'Upload Another File') : (config().allowMultiple ? 'Choose Files' : 'Choose File')"
                    icon="pi pi-upload"
                    (click)="fileInput.click()"
                    [disabled]="uploading()"
                    class="p-button-outlined"></button>

                <span *ngIf="selectedFiles.length > 0" class="selected-file-name">
                    <i class="pi pi-file"></i>
                    <ng-container *ngIf="selectedFiles.length === 1">
                        {{ selectedFiles[0].name }} ({{ formatFileSize(selectedFiles[0].size) }})
                    </ng-container>
                    <ng-container *ngIf="selectedFiles.length > 1">
                        {{ selectedFiles.length }} files selected
                    </ng-container>
                </span>

                <button *ngIf="selectedFiles.length > 0 && !uploading()" pButton type="button" label="Upload Now" icon="pi pi-cloud-upload" (click)="uploadFiles()" class="p-button"></button>
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploading()" class="upload-progress">
                <p-progressBar [value]="uploadProgress()" [showValue]="true"></p-progressBar>
                <small>Uploading files...</small>
            </div>

            <!-- Max Files Warning -->
            <div *ngIf="isMaxFilesReached()" class="alert alert-warning">
                <i class="pi pi-exclamation-triangle"></i>
                Maximum number of files reached ({{ config().maxFiles }})
            </div>

            <!-- Uploaded Files List -->
            <div *ngIf="uploadedFiles().length > 0" class="uploaded-files-list">
                <h6>Uploaded Files ({{ uploadedFiles().length }})</h6>
                <div class="file-list">
                    <div *ngFor="let file of uploadedFiles()" class="file-item">
                        <div class="file-icon">
                            <i [class]="getFileIcon(file.fileName)"></i>
                        </div>
                        <div class="file-details">
                            <div class="file-name">{{ file.fileName }}</div>
                            <div class="file-meta">
                                {{ formatFileSize(file.fileSize) }}
                                <span *ngIf="file.uploadDate"> • Uploaded {{ file.uploadDate | date: 'short' }}</span>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button pButton type="button" icon="pi pi-download" (click)="downloadFile(file)" class="p-button-sm p-button-text" pTooltip="Download"></button>
                            <button *ngIf="!viewMode" pButton type="button" icon="pi pi-trash" (click)="removeFile(file)" class="p-button-sm p-button-text p-button-danger" pTooltip="Remove"></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="uploadedFiles().length === 0 && !uploading()" class="empty-state">
                <i class="pi pi-cloud-upload" style="font-size: 3rem; color: #ccc;"></i>
                <p>No files uploaded yet</p>
                <small>Click "Choose File" to upload</small>
            </div>

            <!-- Required Field Error -->
            <div *ngIf="config().required && uploadedFiles().length === 0 && touched" class="error-message">
                <i class="pi pi-exclamation-circle"></i>
                At least one file is required
            </div>
        </div>
    `,
    styles: [
        `
            .dynamic-file-upload {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 1.5rem;
                background-color: #fafafa;
            }

            .upload-header {
                margin-bottom: 1rem;
            }

            .field-label {
                display: block;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #333;
                font-size: 1rem;
            }

            .required-asterisk {
                color: #e74c3c;
                margin-left: 4px;
            }

            .help-text {
                margin: 0.5rem 0;
                color: #666;
                font-size: 0.9rem;
            }

            .upload-info {
                margin-top: 0.5rem;
            }

            .upload-info small {
                color: #666;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .upload-section {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background-color: white;
                border: 2px dashed #ddd;
                border-radius: 8px;
                margin-bottom: 1rem;
            }

            .selected-file-name {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #333;
                font-size: 0.9rem;
            }

            .upload-progress {
                padding: 1rem;
                background-color: white;
                border-radius: 8px;
                margin-bottom: 1rem;
            }

            .upload-progress small {
                display: block;
                margin-top: 0.5rem;
                color: #666;
            }

            .alert {
                padding: 0.75rem 1rem;
                border-radius: 4px;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .alert-warning {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                color: #856404;
            }

            .uploaded-files-list h6 {
                font-weight: 600;
                margin-bottom: 1rem;
                color: #333;
            }

            .file-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .file-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background-color: white;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                transition: box-shadow 0.2s;
            }

            .file-item:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .file-icon {
                font-size: 2rem;
                color: #666;
            }

            .file-details {
                flex: 1;
            }

            .file-name {
                font-weight: 500;
                color: #333;
                margin-bottom: 0.25rem;
            }

            .file-meta {
                font-size: 0.85rem;
                color: #666;
            }

            .file-actions {
                display: flex;
                gap: 0.5rem;
            }

            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
                color: #999;
            }

            .empty-state p {
                margin: 1rem 0 0.5rem;
                font-size: 1rem;
            }

            .empty-state small {
                color: #bbb;
            }

            .error-message {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #e74c3c;
                font-size: 0.9rem;
                margin-top: 0.5rem;
            }
        `
    ]
})
export class DynamicFileUploadComponent implements OnInit, OnChanges {
    config = input<FileUploadConfig>({
        label: 'File Upload',
        allowMultiple: false,
        maxFiles: 5,
        maxSizeMB: 5,
        acceptedTypes: ['image/*', 'application/pdf'],
        required: false
    });

    @Input() value: UploadedFile[] = [];
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Input() initialFileIds: string[] = [];
    @Output() valueChange = new EventEmitter<UploadedFile[]>();
    @Output() filesUploaded = new EventEmitter<UploadedFile[]>();

    uploadedFiles = signal<UploadedFile[]>([]);
    uploading = signal(false);
    uploadProgress = signal(0);
    loadingFiles = signal(false);
    selectedFiles: File[] = [];
    touched = false;
    private lastInputStateKey = '';
    private metadataLoadToken = 0;

    constructor(
        private fileUploadService: FileUploadServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.syncFromInputs();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value'] || changes['initialFileIds']) {
            this.syncFromInputs();
        }
    }

    private getNormalizedInitialIds(): string[] {
        const ids = Array.isArray(this.initialFileIds) ? this.initialFileIds : [];
        return [...new Set(ids.map((id) => `${id || ''}`.trim()).filter((id) => !!id))];
    }

    private getInputStateKey(): string {
        if (Array.isArray(this.value) && this.value.length > 0) {
            const valueIds = this.value
                .map((f) => `${f?.id || ''}`.trim())
                .filter((id) => !!id)
                .sort();
            return `value:${valueIds.join('|')}`;
        }

        const initialIds = this.getNormalizedInitialIds().sort();
        return `ids:${initialIds.join('|')}`;
    }

    private syncFromInputs(): void {
        const nextStateKey = this.getInputStateKey();
        if (nextStateKey === this.lastInputStateKey) {
            return;
        }

        this.lastInputStateKey = nextStateKey;
        this.selectedFiles = [];

        if (Array.isArray(this.value) && this.value.length > 0) {
            this.uploadedFiles.set([...this.value]);
            this.loadingFiles.set(false);
            return;
        }

        const initialIds = this.getNormalizedInitialIds();
        if (initialIds.length === 0) {
            this.metadataLoadToken++;
            this.uploadedFiles.set([]);
            this.loadingFiles.set(false);
            return;
        }

        const activeToken = ++this.metadataLoadToken;
        this.loadingFiles.set(true);
        void this.loadFilesByIds(initialIds, activeToken);
    }

    private async loadFilesByIds(initialIds: string[], activeToken: number): Promise<void> {
        try {
            const files: UploadedFile[] = [];
            for (const id of initialIds) {
                const res = await firstValueFrom(this.fileUploadService.file_GetByFileId(id));
                if ((res as any).result) {
                    const data = (res as any).result as FileMetadataDto;
                    files.push({
                        id: data.id!,
                        fileName: data.fileName!,
                        filePath: data.filePath!,
                        fileSize: data.size || 0,
                        uploadDate: new Date(),
                        description: data.description
                    });
                }
            }

            if (activeToken === this.metadataLoadToken) {
                this.uploadedFiles.set(files);
            }
        } catch (error) {
            if (activeToken === this.metadataLoadToken) {
                console.error('Error loading initial files:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load initial files.' });
            }
        } finally {
            if (activeToken === this.metadataLoadToken) {
                this.loadingFiles.set(false);
            }
        }
    }

    getAcceptedTypes(): string {
        return this.config().acceptedTypes?.join(',') || '*/*';
    }

    onFileSelect(event: any) {
        const files = event.target.files as FileList | null;
        if (!files || files.length === 0) {
            return;
        }

        const maxSize = (this.config().maxSizeMB || 5) * 1024 * 1024;
        const acceptedTypes = this.config().acceptedTypes || [];
        const maxFiles = this.config().allowMultiple ? this.config().maxFiles || 5 : 1;
        const availableSlots = Math.max(0, maxFiles - this.uploadedFiles().length);

        const pickedFiles = Array.from(files);
        const nextSelected: File[] = [];

        for (const file of pickedFiles) {
            if (nextSelected.length >= availableSlots) {
                break;
            }

            if (file.size > maxSize) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'File Too Large',
                    detail: `${file.name} exceeds ${this.config().maxSizeMB || 5}MB limit`
                });
                continue;
            }

            if (!this.isAcceptedFileType(file, acceptedTypes)) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Invalid File Type',
                    detail: `${file.name} is not an allowed file type`
                });
                continue;
            }

            nextSelected.push(file);
            if (!this.config().allowMultiple) {
                break;
            }
        }

        this.selectedFiles = nextSelected;
        event.target.value = '';

        if (pickedFiles.length > availableSlots) {
            this.messageService.add({
                severity: 'warn',
                summary: 'File Limit Reached',
                detail: `Only ${availableSlots} more file(s) can be uploaded`
            });
        }
    }

    async uploadFiles() {
        if (!this.selectedFiles.length) return;

        this.touched = true;
        this.uploading.set(true);
        this.uploadProgress.set(0);

        try {
            const uploadedNow: UploadedFile[] = [];

            for (let index = 0; index < this.selectedFiles.length; index++) {
                const selectedFile = this.selectedFiles[index];
                const response = await firstValueFrom(
                    this.fileUploadService.file_UploadFile(
                        undefined,
                        this.memberId || undefined,
                        this.config().documentType || undefined,
                        undefined,
                        this.config().required || false,
                        { data: selectedFile, fileName: selectedFile.name } as any
                    )
                );

                uploadedNow.push({
                    id: response?.result!.id!,
                    fileName: response?.result!.fileName || selectedFile.name,
                    filePath: response?.result!.filePath || '',
                    fileSize: selectedFile.size,
                    uploadDate: new Date(),
                    description: this.config().documentType
                });

                const progress = Math.round(((index + 1) / this.selectedFiles.length) * 100);
                this.uploadProgress.set(progress);
            }

            const updatedFiles = [...this.uploadedFiles(), ...uploadedNow];
            this.uploadedFiles.set(updatedFiles);
            this.valueChange.emit(updatedFiles);
            this.filesUploaded.emit(updatedFiles);

            this.messageService.add({
                severity: 'success',
                summary: 'Upload Successful',
                detail: `${uploadedNow.length} file(s) uploaded successfully`
            });

            this.selectedFiles = [];
            this.uploading.set(false);
            this.uploadProgress.set(0);
        } catch (error) {
            console.error('Upload error:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: 'Failed to upload file. Please try again.'
            });
            this.uploading.set(false);
            this.uploadProgress.set(0);
        }
    }

    private isAcceptedFileType(file: File, acceptedTypes: string[]): boolean {
        if (!acceptedTypes || acceptedTypes.length === 0) {
            return true;
        }

        const fileType = (file.type || '').toLowerCase();
        const fileName = file.name.toLowerCase();

        return acceptedTypes.some((type) => {
            const normalized = (type || '').trim().toLowerCase();
            if (!normalized) {
                return false;
            }

            if (normalized.startsWith('.')) {
                return fileName.endsWith(normalized);
            }

            if (normalized.endsWith('/*')) {
                const category = normalized.replace('/*', '');
                return fileType.startsWith(category + '/');
            }

            return fileType === normalized;
        });
    }

    removeFile(file: UploadedFile) {
        if (confirm(`Are you sure you want to remove ${file.fileName}?`)) {
            // Call delete API
            this.fileUploadService.file_DeleteFile(file.id).subscribe({
                next: () => {
                    const updatedFiles = this.uploadedFiles().filter((f) => f.id !== file.id);
                    this.uploadedFiles.set(updatedFiles);
                    this.valueChange.emit(updatedFiles);
                    this.filesUploaded.emit(updatedFiles);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'File Removed',
                        detail: `${file.fileName} has been removed`
                    });
                },
                error: (error) => {
                    console.error('Delete error:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Delete Failed',
                        detail: 'Failed to remove file'
                    });
                }
            });
        }
    }

    downloadFile(file: UploadedFile) {
        if (file.filePath) {
            window.open(file.filePath, '_blank');
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Download Unavailable',
                detail: 'File path not available'
            });
        }
    }

    isMaxFilesReached(): boolean {
        return this.config().maxFiles !== undefined && this.uploadedFiles().length >= this.config().maxFiles!;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    getFileIcon(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'pdf':
                return 'pi pi-file-pdf';
            case 'doc':
            case 'docx':
                return 'pi pi-file-word';
            case 'xls':
            case 'xlsx':
                return 'pi pi-file-excel';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'pi pi-image';
            default:
                return 'pi pi-file';
        }
    }

    isValid(): boolean {
        if (this.config().required) {
            return this.uploadedFiles().length > 0;
        }
        return true;
    }
}
