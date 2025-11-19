import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-about-us-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about-us-widget.component.html',
    styleUrls: ['./about-us-widget.component.scss']
})
export class AboutUsWidgetComponent {
    @Input() config!: WidgetConfig;

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        // Assuming tenantId is not directly available here, or handled by backend
        return `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
    }
}
