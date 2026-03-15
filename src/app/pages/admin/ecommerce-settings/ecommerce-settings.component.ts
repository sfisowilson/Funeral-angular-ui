import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../../environments/environment';

interface EcommerceSettings {
    publicShopEnabled: boolean;
}

@Component({
    selector: 'app-ecommerce-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, CardModule, ButtonModule, ToggleButtonModule, ProgressSpinnerModule],
    providers: [MessageService],
    templateUrl: './ecommerce-settings.component.html'
})
export class EcommerceSettingsComponent implements OnInit {
    private http = inject(HttpClient);
    private messageService = inject(MessageService);

    settings: EcommerceSettings = { publicShopEnabled: false };
    loading = false;
    saving = false;

    private get apiBase(): string {
        return `${environment.apiUrl}/api/EcommerceSettings`;
    }

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings(): void {
        this.loading = true;
        this.http.get<EcommerceSettings>(`${this.apiBase}/GetSettings`).subscribe({
            next: (res) => {
                this.settings = res;
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ecommerce settings.' });
                this.loading = false;
            }
        });
    }

    saveSettings(): void {
        this.saving = true;
        this.http.put(`${this.apiBase}/UpdateSettings`, this.settings).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Ecommerce settings saved successfully.' });
                this.saving = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save ecommerce settings.' });
                this.saving = false;
            }
        });
    }
}

