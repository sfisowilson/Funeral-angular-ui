import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FileUploadServiceProxy, API_BASE_URL } from '../../core/services/service-proxies';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-whatsapp-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-editor.component.html',
  styleUrl: './whatsapp-editor.component.css'
})
export class WhatsappEditorComponent implements OnInit {
  @Input() config!: WidgetConfig;
  @Output() update = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  localSettings: any = {};
  uploadingPhoto = false;

  constructor(
    private fileUploadService: FileUploadServiceProxy,
    @Inject(API_BASE_URL) private baseUrl: string
  ) {}

  ngOnInit(): void {
    // Deep copy config.settings to localSettings to work on a mutable copy
    this.localSettings = JSON.parse(JSON.stringify(this.config.settings || {}));

    // Initialize default values on localSettings
    if (!this.localSettings.phoneNumber) this.localSettings.phoneNumber = '';
    if (!this.localSettings.agentName) this.localSettings.agentName = 'Support Team';
    if (!this.localSettings.agentPhoto) this.localSettings.agentPhoto = '';
    if (!this.localSettings.welcomeMessage) this.localSettings.welcomeMessage = 'Hi there! How can we help you today?';
    if (!this.localSettings.defaultMessage) this.localSettings.defaultMessage = 'Hi, I would like to get in touch.';
    if (!this.localSettings.buttonText) this.localSettings.buttonText = 'Start Chat';
    if (!this.localSettings.position) this.localSettings.position = 'right';
    if (this.localSettings.sidePosition === undefined) this.localSettings.sidePosition = 20;
    if (this.localSettings.bottomPosition === undefined) this.localSettings.bottomPosition = 20;
    if (!this.localSettings.buttonColor) this.localSettings.buttonColor = 'var(--primary-color, #25d366)';
    if (this.localSettings.buttonSize === undefined) this.localSettings.buttonSize = 60;
    if (this.localSettings.borderRadius === undefined) this.localSettings.borderRadius = 50;
    if (!this.localSettings.headerBackgroundColor) this.localSettings.headerBackgroundColor = 'var(--primary-dark, #075e54)';
    if (!this.localSettings.headerTextColor) this.localSettings.headerTextColor = 'var(--primary-contrast-color, #ffffff)';
    if (!this.localSettings.expandedBackgroundColor) this.localSettings.expandedBackgroundColor = 'var(--surface-card, #f0f0f0)';
    if (!this.localSettings.expandedTextColor) this.localSettings.expandedTextColor = 'var(--text-dark, #333333)';

    if (this.localSettings.showOnlineStatus === undefined) this.localSettings.showOnlineStatus = true;
    if (this.localSettings.zIndex === undefined) this.localSettings.zIndex = 1000;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingPhoto = true;
    const fileParameter = { data: file, fileName: file.name };

    this.fileUploadService.file_UploadFile('WhatsAppAgent', '', undefined, undefined, false, fileParameter)
      .subscribe({
        next: (result: any) => {
          this.localSettings.agentPhoto = `${this.baseUrl}/api/file-upload/download/${result.id}`;
          this.uploadingPhoto = false;
        },
        error: (error) => {
          console.error('Error uploading photo:', error);
          this.uploadingPhoto = false;
        }
      });
  }

  removePhoto(): void {
    this.localSettings.agentPhoto = '';
  }

  formatPhoneNumber(): void {
    // Remove all non-digit characters for validation
    const cleaned = this.localSettings.phoneNumber.replace(/\D/g, '');
    if (cleaned.length > 0) {
      this.localSettings.phoneNumber = cleaned;
    }
  }

  saveChanges(): void {
    // Deep copy local changes back to the config object
    this.config.settings = JSON.parse(JSON.stringify(this.localSettings));
    this.update.emit(this.config.settings);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

