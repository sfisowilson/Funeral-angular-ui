import { Component, Input, OnInit, Inject, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogoItem } from './logo-cloud-widget.component';
import { FileUploadServiceProxy, FileParameter, FileMetadataDto, API_BASE_URL } from '../../core/services/service-proxies';

@Component({
  selector: 'app-logo-cloud-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logo-cloud-editor.component.html',
  styleUrls: ['./logo-cloud-editor.component.scss'],
  providers: [FileUploadServiceProxy]
})
export class LogoCloudEditorComponent implements OnInit {
  @Input() config: any = {};
  @Output() update = new EventEmitter<any>();

  uploadingIndex: number | null = null;
  baseUrl: string;

  constructor(
    private fileUploadService: FileUploadServiceProxy,
    @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
  }

  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'Trusted By Leading Funeral Homes',
        subtitle: 'Join hundreds of funeral service providers who trust our platform',
        layout: 'grid',
        columns: 4,
        grayscale: true,
        hoverColor: true,
        logoSize: 'medium'
      };
    }

    if (!this.config.logos || this.config.logos.length === 0) {
      this.config.logos = [
        {
          name: 'Partner 1',
          imageUrl: 'https://via.placeholder.com/150x60?text=Partner+1',
          link: '',
          altText: 'Partner 1 Logo'
        },
        {
          name: 'Partner 2',
          imageUrl: 'https://via.placeholder.com/150x60?text=Partner+2',
          link: '',
          altText: 'Partner 2 Logo'
        },
        {
          name: 'Partner 3',
          imageUrl: 'https://via.placeholder.com/150x60?text=Partner+3',
          link: '',
          altText: 'Partner 3 Logo'
        },
        {
          name: 'Partner 4',
          imageUrl: 'https://via.placeholder.com/150x60?text=Partner+4',
          link: '',
          altText: 'Partner 4 Logo'
        }
      ];
    }
  }

  addLogo() {
    const newLogo: LogoItem = {
      name: 'New Logo',
      imageUrl: 'https://via.placeholder.com/150x60?text=New+Logo',
      link: '',
      altText: 'New Logo'
    };
    this.config.logos.push(newLogo);
  }

  removeLogo(index: number) {
    this.config.logos.splice(index, 1);
  }

  moveLogoUp(index: number) {
    if (index > 0) {
      const temp = this.config.logos[index];
      this.config.logos[index] = this.config.logos[index - 1];
      this.config.logos[index - 1] = temp;
    }
  }

  moveLogoDown(index: number) {
    if (index < this.config.logos.length - 1) {
      const temp = this.config.logos[index];
      this.config.logos[index] = this.config.logos[index + 1];
      this.config.logos[index + 1] = temp;
    }
  }

  onLogoFileSelect(event: any, index: number) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    this.uploadingIndex = index;

    const fileParameter: FileParameter = {
      data: file,
      fileName: file.name
    };

    this.fileUploadService.file_UploadFile('LogoCloud', undefined, undefined, undefined, false, fileParameter).subscribe({
      next: (result: FileMetadataDto) => {
        const imageUrl = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${result.id}`;
        this.config.logos[index].imageUrl = imageUrl;
        this.uploadingIndex = null;
      },
      error: (error: any) => {
        console.error('Logo upload error:', error);
        alert('Failed to upload logo: ' + (error?.error?.error || error?.message || 'Unknown error'));
        this.uploadingIndex = null;
      }
    });
  }

  onSave() {
    this.update.emit(this.config.settings);
  }
}
