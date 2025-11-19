import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FileHelperService {
    /**
     * Generate a download URL for a file using its ID
     * @param fileId The file ID from the backend
     * @param tenantIdHeader Optional tenant ID header for multi-tenant support
     * @returns The complete download URL
     */
    getDownloadUrl(fileId: string | null | undefined, tenantIdHeader?: HttpHeaders): string {
        if (!fileId) {
            return '';
        }
        
        let url = `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
        
        // Add tenant ID as query parameter if provided
        if (tenantIdHeader && tenantIdHeader.has('X-Tenant-ID')) {
            url += `?X-Tenant-ID=${tenantIdHeader.get('X-Tenant-ID')}`;
        }
        
        return url;
    }
}
