import { Component, Input, OnInit } from '@angular/core';
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
  uploadingPhoto = false;

  constructor(
    private fileUploadService: FileUploadServiceProxy,
    @Inject(API_BASE_URL) private baseUrl: string
  ) {}

  get settings(): any {
    return this.config as any;
  }

  ngOnInit(): void {
    // Initialize default values
    if (!this.settings.phoneNumber) this.settings.phoneNumber = '';
    if (!this.settings.agentName) this.settings.agentName = 'Support Team';
    if (!this.settings.agentPhoto) this.settings.agentPhoto = '';
    if (!this.settings.welcomeMessage) this.settings.welcomeMessage = 'Hi there! How can we help you today?';
    if (!this.settings.defaultMessage) this.settings.defaultMessage = 'Hi, I would like to get in touch.';
    if (!this.settings.buttonText) this.settings.buttonText = 'Start Chat';
    if (!this.settings.position) this.settings.position = 'right';
    if (this.settings.sidePosition === undefined) this.settings.sidePosition = 20;
    if (this.settings.bottomPosition === undefined) this.settings.bottomPosition = 20;
    if (!this.settings.buttonColor) this.settings.buttonColor = '#25d366';
    if (this.settings.buttonSize === undefined) this.settings.buttonSize = 60;
    if (this.settings.borderRadius === undefined) this.settings.borderRadius = 50;
    if (!this.settings.headerBackgroundColor) this.settings.headerBackgroundColor = '#075e54';
    if (!this.settings.headerTextColor) this.settings.headerTextColor = '#ffffff';
    if (!this.settings.expandedBackgroundColor) this.settings.expandedBackgroundColor = '#f0f0f0';
    if (!this.settings.expandedTextColor) this.settings.expandedTextColor = '#333333';
    if (this.settings.showOnlineStatus === undefined) this.settings.showOnlineStatus = true;
    if (this.settings.zIndex === undefined) this.settings.zIndex = 1000;
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingPhoto = true;
    const fileParameter = { data: file, fileName: file.name };

    this.fileUploadService.file_UploadFile('WhatsAppAgent', '', undefined, undefined, false, fileParameter)
      .subscribe({
        next: (result: any) => {
          this.settings.agentPhoto = `${this.baseUrl}/api/file-upload/download/${result.id}`;
          this.uploadingPhoto = false;
        },
        error: (error) => {
          console.error('Error uploading photo:', error);
          this.uploadingPhoto = false;
        }
      });
  }

  removePhoto(): void {
    this.settings.agentPhoto = '';
  }

  formatPhoneNumber(): void {
    // Remove all non-digit characters for validation
    const cleaned = this.settings.phoneNumber.replace(/\D/g, '');
    if (cleaned.length > 0) {
      this.settings.phoneNumber = cleaned;
    }
  }
}
