import { Component, Input, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FileUploadServiceProxy, API_BASE_URL } from '../../core/services/service-proxies';

@Component({
  selector: 'app-slider-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slider-editor.component.html',
  styleUrl: './slider-editor.component.css'
})
export class SliderEditorComponent implements OnInit {
  @Input() config!: WidgetConfig;
  uploadingSlideIndex: number | null = null;

  @Output() update = new EventEmitter<any>();

  // Helper to access settings - properly access the settings property
  get settings(): any {
    // Ensure settings object exists
    if (!this.config.settings) {
      this.config.settings = {};
    }
    return this.config.settings;
  }

  constructor(
    private fileUploadService: FileUploadServiceProxy,
    @Inject(API_BASE_URL) private baseUrl: string
  ) {}

  ngOnInit(): void {
    // Initialize default values if not present
    if (!this.settings.slides) {
      this.settings.slides = [];
    }
    if (this.settings.height === undefined) {
      this.settings.height = 500;
    }
    if (this.settings.autoplay === undefined) {
      this.settings.autoplay = true;
    }
    if (this.settings.autoplaySpeed === undefined) {
      this.settings.autoplaySpeed = 5000;
    }
    if (this.settings.showArrows === undefined) {
      this.settings.showArrows = true;
    }
    if (this.settings.showDots === undefined) {
      this.settings.showDots = true;
    }
    if (this.settings.titleSize === undefined) {
      this.settings.titleSize = 48;
    }
    if (this.settings.subtitleSize === undefined) {
      this.settings.subtitleSize = 20;
    }
    if (this.settings.overlayOpacity === undefined) {
      this.settings.overlayOpacity = 0.4;
    }
    if (!this.settings.titleColor) {
      this.settings.titleColor = '#ffffff';
    }
    if (!this.settings.subtitleColor) {
      this.settings.subtitleColor = '#ffffff';
    }
    if (!this.settings.buttonColor) {
      this.settings.buttonColor = '#007bff';
    }
    if (!this.settings.buttonTextColor) {
      this.settings.buttonTextColor = '#ffffff';
    }
    if (this.settings.buttonTextSize === undefined) {
      this.settings.buttonTextSize = 16;
    }
    if (this.settings.showButton === undefined) {
      this.settings.showButton = true;
    }
    if (!this.settings.arrowBackgroundColor) {
      this.settings.arrowBackgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
    if (!this.settings.arrowColor) {
      this.settings.arrowColor = '#ffffff';
    }
    if (this.settings.dotSize === undefined) {
      this.settings.dotSize = 12;
    }
    if (!this.settings.dotColor) {
      this.settings.dotColor = 'rgba(255, 255, 255, 0.5)';
    }
    if (!this.settings.dotActiveColor) {
      this.settings.dotActiveColor = '#ffffff';
    }
    if (!this.settings.dotsBackgroundColor) {
      this.settings.dotsBackgroundColor = 'rgba(0, 0, 0, 0.3)';
    }
    if (this.settings.borderRadius === undefined) {
      this.settings.borderRadius = 0;
    }
    if (this.settings.padding === undefined) {
      this.settings.padding = 0;
    }
  }

  addSlide(): void {
    this.settings.slides.push({
      imageUrl: '',
      title: 'New Slide Title',
      subtitle: 'Add your slide description here',
      buttonText: '',
      buttonLink: '',
      overlayOpacity: undefined
    });
  }

  removeSlide(index: number): void {
    if (confirm('Are you sure you want to remove this slide?')) {
      this.settings.slides.splice(index, 1);
    }
  }

  onImageSelected(event: any, slideIndex: number): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingSlideIndex = slideIndex;

    try {
      const fileParameter = {
        data: file,
        fileName: file.name
      };

      this.fileUploadService.file_UploadFile('SliderImage', '', undefined, undefined, false, fileParameter).subscribe({
        next: (result: any) => {
          if (result?.id) {
            // Construct the download URL
            this.settings.slides[slideIndex].imageUrl = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${result.id}`;
          }
          this.uploadingSlideIndex = null;
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          this.uploadingSlideIndex = null;
        }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      this.uploadingSlideIndex = null;
    }
  }

  saveSettings() {
    // Emit the updated settings object to the parent (like cta-editor)
    this.update.emit(this.settings);
  }
}
