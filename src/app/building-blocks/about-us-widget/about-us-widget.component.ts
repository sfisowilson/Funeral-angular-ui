import { CommonModule } from '@angular/common';
import { Component, Input, Inject, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { API_BASE_URL } from '../../core/services/service-proxies';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Component({
    selector: 'app-about-us-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about-us-widget.component.html',
    styleUrls: ['./about-us-widget.component.scss']
})
export class AboutUsWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;
    customStyles: SafeStyle = '';

    constructor(
        @Inject(API_BASE_URL) private baseUrl: string,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.applyCustomColors();
    }

    private applyCustomColors(): void {
        const settings = this.config.settings || {};
        const cssVariables: string[] = [];

        // Always set CSS variables with widget colors or theme fallbacks
        cssVariables.push(`--widget-primary-color: ${settings.primaryColor || 'var(--primary-color, #667eea)'}`);
        cssVariables.push(`--widget-secondary-color: ${settings.secondaryColor || 'var(--secondary-color, var(--accent-color, #764ba2))'}`);
        cssVariables.push(`--widget-text-color: ${settings.textColor || 'var(--text-color, #1a202c)'}`);
        cssVariables.push(`--widget-bg-color: ${settings.backgroundColor || 'var(--background-color, #ffffff)'}`);
        cssVariables.push(`--widget-text-muted: ${settings.textColor || 'var(--text-color-secondary, #718096)'}`);

        this.customStyles = this.sanitizer.bypassSecurityTrustStyle(
            cssVariables.join('; ')
        );
    }

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        // Assuming tenantId is not directly available here, or handled by backend
        return `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }
}
