import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './service-proxies';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WhatsAppSettings {
    phoneNumberId?: string;
    businessAccountId?: string;
}

@Injectable({
    providedIn: 'root'
})
export class WhatsAppSettingsService {
    constructor(
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {}

    hasCredentials(): Observable<boolean> {
        return this.http.get<any>(`${this.baseUrl}/api/WhatsApp/WhatsApp_HasCredentials`).pipe(
            map(response => response?.hasCredentials || response?.result?.hasCredentials || false)
        );
    }

    saveCredentials(phoneNumberId: string, accessToken: string, businessAccountId?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/api/WhatsApp/WhatsApp_SaveCredentials`, {
            phoneNumberId,
            accessToken,
            businessAccountId: businessAccountId || ''
        });
    }

    sendTestMessage(recipientPhone: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/api/WhatsApp/WhatsApp_SendTestMessage`, {
            recipientPhone
        });
    }

    deleteCredentials(): Observable<any> {
        return this.http.post(`${this.baseUrl}/api/WhatsApp/WhatsApp_DeleteCredentials`, {});
    }

    toggleEnable(enabled: boolean): Observable<any> {
        return this.http.post(`${this.baseUrl}/api/WhatsApp/WhatsApp_ToggleEnable`, {
            enabled
        });
    }
}
