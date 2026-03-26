import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { hexToRgba } from '../widget-color.utils';

export interface VideoEmbedSettings {
    title?: string;
    subtitle?: string;
    videoUrl?: string;
    provider?: 'youtube' | 'vimeo' | 'custom';
    aspectRatio?: '16:9' | '4:3' | '1:1';
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    caption?: string;
}

@Component({
    selector: 'app-video-embed-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './video-embed-widget.component.html',
    styleUrls: ['./video-embed-widget.component.scss']
})
export class VideoEmbedWidgetComponent {
    @Input() config: any = {};

    constructor(private sanitizer: DomSanitizer) {}

    get title(): string {
        return this.config.settings?.title || '';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get captionColor(): string { return this.config.settings?.captionColor || '#6c757d'; }
    get placeholderBackgroundColor(): string { return hexToRgba(this.config.settings?.placeholderBackgroundColor || '#f8f9fa', this.config.settings?.placeholderBackgroundOpacity ?? 1); }
    get placeholderTextColor(): string { return this.config.settings?.placeholderTextColor || '#6c757d'; }

    get settings(): VideoEmbedSettings {
        return this.config.settings || {};
    }

    get videoUrl(): string {
        return this.settings.videoUrl || '';
    }

    get embedUrl(): SafeResourceUrl {
        let url = this.videoUrl;

        if (this.settings.provider === 'youtube') {
            const videoId = this.extractYouTubeId(url);
            if (videoId) {
                url = `https://www.youtube.com/embed/${videoId}?`;
                if (this.settings.autoplay) url += 'autoplay=1&';
                if (!this.settings.controls) url += 'controls=0&';
                if (this.settings.loop) url += `loop=1&playlist=${videoId}&`;
                if (this.settings.muted) url += 'mute=1&';
            }
        } else if (this.settings.provider === 'vimeo') {
            const videoId = this.extractVimeoId(url);
            if (videoId) {
                url = `https://player.vimeo.com/video/${videoId}?`;
                if (this.settings.autoplay) url += 'autoplay=1&';
                if (this.settings.loop) url += 'loop=1&';
                if (this.settings.muted) url += 'muted=1&';
            }
        }

        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    get aspectRatio(): string {
        return this.settings.aspectRatio || '16:9';
    }

    get paddingBottom(): string {
        const ratios: { [key: string]: string } = {
            '16:9': '56.25%',
            '4:3': '75%',
            '1:1': '100%'
        };
        return ratios[this.aspectRatio] || '56.25%';
    }

    get caption(): string {
        return this.settings.caption || '';
    }

    private extractYouTubeId(url: string): string | null {
        const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, /youtube\.com\/embed\/([^&\n?#]+)/];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    private extractVimeoId(url: string): string | null {
        const pattern = /vimeo\.com\/(\d+)/;
        const match = url.match(pattern);
        return match && match[1] ? match[1] : null;
    }
}
