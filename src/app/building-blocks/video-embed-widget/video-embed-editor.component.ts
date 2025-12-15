import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-embed-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-embed-editor.component.html',
  styleUrls: ['./video-embed-editor.component.scss']
})
export class VideoEmbedEditorComponent implements OnInit {
  @Input() config: any = {};

  ngOnInit() {
    if (!this.config.settings) {
      this.config.settings = {
        title: 'Watch Our Demo',
        subtitle: 'See the platform in action',
        videoUrl: '',
        provider: 'youtube',
        aspectRatio: '16:9',
        autoplay: false,
        controls: true,
        loop: false,
        muted: false,
        caption: ''
      };
    }
  }

  onProviderChange() {
    // Clear video URL when provider changes to avoid confusion
    if (!this.isValidUrl()) {
      this.config.settings.videoUrl = '';
    }
  }

  isValidUrl(): boolean {
    const url = this.config.settings.videoUrl || '';
    if (!url) return false;

    if (this.config.settings.provider === 'youtube') {
      return /youtube\.com|youtu\.be/.test(url);
    } else if (this.config.settings.provider === 'vimeo') {
      return /vimeo\.com/.test(url);
    }
    return true;
  }

  getPlaceholderUrl(): string {
    if (this.config.settings.provider === 'youtube') {
      return 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID';
    } else if (this.config.settings.provider === 'vimeo') {
      return 'https://vimeo.com/YOUR_VIDEO_ID';
    }
    return 'https://example.com/video-embed-url';
  }
}
