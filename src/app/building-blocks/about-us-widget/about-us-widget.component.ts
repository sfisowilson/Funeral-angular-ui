import { CommonModule } from '@angular/common';
import { Component, Input, Inject } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { API_BASE_URL } from '../../core/services/service-proxies';

@Component({
    selector: 'app-about-us-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about-us-widget.component.html',
    styleUrls: ['./about-us-widget.component.scss']
})
export class AboutUsWidgetComponent {
    @Input() config!: WidgetConfig;

    constructor(@Inject(API_BASE_URL) private baseUrl: string) {}

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        // Assuming tenantId is not directly available here, or handled by backend
        return `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }
}
