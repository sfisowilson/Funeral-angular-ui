import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FileUploadServiceProxy, FileMetadataDto } from '@app/core/services/service-proxies';

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
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ProgressBarModule,
        TooltipModule,
        ToastModule
    ],
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
                        <span *ngIf="config().allowMultiple && config().maxFiles">
                            | Max {{ config().maxFiles }} files
                        </span>
                    </small>
                </div>
            </div>

            <!-- Upload Section -->
            <div *ngIf="!isMaxFilesReached()" class="upload-section">
                <input 
                    #fileInput
                    type="file" 
                    [multiple]="config().allowMultiple"
                    [accept]="getAcceptedTypes()"
                    (change)="onFileSelect($event)"
                    style="display: none"
                />
                
                <button 
                    pButton 
                    type="button"
                    [label]="uploadedFiles().length > 0 ? 'Upload Another File' : 'Choose File'"
                    icon="pi pi-upload" 
                    (click)="fileInput.click()"
                    [disabled]="uploading()"
                    class="p-button-outlined">
                </button>

                <span *ngIf="selectedFile" class="selected-file-name">
                    <i class="pi pi-file"></i>
                    {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                </span>

                <button 
                    *ngIf="selectedFile && !uploading()"
                    pButton 
                    type="button"
                    label="Upload Now"
                    icon="pi pi-cloud-upload" 
                    (click)="uploadFile()"
                    class="p-button-success">
                </button>
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploading()" class="upload-progress">
                <p-progressBar [value]="uploadProgress()" [showValue]="true"></p-progressBar>
                <small>Uploading {{ selectedFile?.name }}...</small>
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
                                <span *ngIf="file.uploadDate"> • Uploaded {{ file.uploadDate | date:'short' }}</span>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button 
                                pButton 
                                type="button"
                                icon="pi pi-download" 
                                (click)="downloadFile(file)"
                                class="p-button-sm p-button-text"
                                pTooltip="Download">
                            </button>
                            <button 
                                *ngIf="!viewMode"
                                pButton 
                                type="button"
                                icon="pi pi-trash" 
                                (click)="removeFile(file)"
                                class="p-button-sm p-button-text p-button-danger"
                                pTooltip="Remove">
                            </button>
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
    styles: [`
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
    `]
})
export class DynamicFileUploadComponent implements OnInit {
    @Input() config = signal<FileUploadConfig>({
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
    @Output() valueChange = new EventEmitter<UploadedFile[]>();
    @Output() filesUploaded = new EventEmitter<UploadedFile[]>();

    uploadedFiles = signal<UploadedFile[]>([]);
    uploading = signal(false);
    uploadProgress = signal(0);
    selectedFile?: File;
    touched = false;

    constructor(
        private fileUploadService: FileUploadServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        // Load existing files
        if (this.value && Array.isArray(this.value)) {
            this.uploadedFiles.set([...this.value]);
        }
    }

    getAcceptedTypes(): string {
        return this.config().acceptedTypes?.join(',') || '*/*';
    }

    onFileSelect(event: any) {
        const files = event.target.files;
        if (files && files.length > 0) {
            this.selectedFile = files[0];
            
            // Validate file size
            const maxSize = (this.config().maxSizeMB || 5) * 1024 * 1024;
            if (this.selectedFile && this.selectedFile.size > maxSize) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'File Too Large',
                    detail: `File size exceeds ${this.config().maxSizeMB}MB limit`
                });
                this.selectedFile = undefined;
                event.target.value = '';
                return;
            }

            // Validate file type
            const acceptedTypes = this.config().acceptedTypes || [];
            if (acceptedTypes.length > 0 && this.selectedFile) {
                const fileType = this.selectedFile.type;
                const isAccepted = acceptedTypes.some(type => {
                    if (type.endsWith('/*')) {
                        const category = type.replace('/*', '');
                        return fileType.startsWith(category);
                    }
                    return type === fileType;
                });

                if (!isAccepted) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Invalid File Type',
                        detail: 'Please select a valid file type'
                    });
                    this.selectedFile = undefined;
                    event.target.value = '';
                }
            }
        }
    }

    async uploadFile() {
        if (!this.selectedFile) return;

        this.touched = true;
        this.uploading.set(true);
        this.uploadProgress.set(0);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            
            if (this.config().documentType) {
                formData.append('documentType', this.config().documentType!);
            }
            if (this.memberId) {
                formData.append('memberId', this.memberId);
            }

            // Simulate progress (since we can't get real progress from the proxy)
            const progressInterval = setInterval(() => {
                const current = this.uploadProgress();
                if (current < 90) {
                    this.uploadProgress.set(current + 10);
                }
            }, 200);

            // Upload file
            const memberId = this.memberId || undefined;
            const result = await this.fileUploadService.file_UploadFile(
                { data: formData, fileName: this.selectedFile.name } as any,
                memberId,
                undefined, // documentType
                undefined, // description
                undefined, // category
                undefined  // tags
            ).toPromise();

            clearInterval(progressInterval);
            this.uploadProgress.set(100);

            // Add to uploaded files list
            const uploadedFile: UploadedFile = {
                id: result!.id!,
                fileName: result!.fileName || this.selectedFile.name,
                filePath: result!.filePath || '',
                fileSize: this.selectedFile.size,
                uploadDate: new Date(),
                description: this.config().documentType
            };

            const updatedFiles = [...this.uploadedFiles(), uploadedFile];
            this.uploadedFiles.set(updatedFiles);
            this.valueChange.emit(updatedFiles);
            this.filesUploaded.emit(updatedFiles);

            this.messageService.add({
                severity: 'success',
                summary: 'Upload Successful',
                detail: `${this.selectedFile.name} uploaded successfully`
            });

            // Reset
            this.selectedFile = undefined;
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

    removeFile(file: UploadedFile) {
        if (confirm(`Are you sure you want to remove ${file.fileName}?`)) {
            // Call delete API
            this.fileUploadService.file_DeleteFile(file.id).subscribe({
                next: () => {
                    const updatedFiles = this.uploadedFiles().filter(f => f.id !== file.id);
                    this.uploadedFiles.set(updatedFiles);
                    this.valueChange.emit(updatedFiles);

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
        return this.config().maxFiles !== undefined && 
               this.uploadedFiles().length >= this.config().maxFiles!;
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
