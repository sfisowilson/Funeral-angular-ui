import { Component, Input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { VerificationServiceProxy, VerificationRequestDto } from '../../../core/services/service-proxies';

interface VerificationStatus {
    status: string;
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger';
    icon: string;
}

@Component({
    selector: 'app-verification-status',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, ButtonModule, DividerModule, ProgressSpinnerModule],
    templateUrl: './verification-status.component.html',
    styleUrl: './verification-status.component.scss'
})
export class VerificationStatusComponent implements OnInit {
    @Input() memberId?: string;
    @Input() userId?: string;
    @Input() showHeader: boolean = true;
    @Input() compact: boolean = false;

    verificationRequests = signal<VerificationRequestDto[]>([]);
    loading = signal(false);

    constructor(private verificationService: VerificationServiceProxy) {}

    ngOnInit(): void {
        this.loadVerificationStatus();
    }

    loadVerificationStatus(): void {
        if (!this.memberId && !this.userId) return;

        this.loading.set(true);

        if (this.memberId) {
            this.verificationService.verification_GetByMember(this.memberId).subscribe({
                next: (requests) => {
                    this.verificationRequests.set(requests || []);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error loading verification status:', error);
                    this.loading.set(false);
                }
            });
        }
    }

    getVerificationStatus(status: string): VerificationStatus {
        switch (status?.toUpperCase()) {
            case 'VERIFIED':
            case 'COMPLETED':
                return {
                    status,
                    label: 'Verified',
                    severity: 'success',
                    icon: 'pi pi-check-circle'
                };
            case 'PENDING':
            case 'PROCESSING':
                return {
                    status,
                    label: 'Processing',
                    severity: 'info',
                    icon: 'pi pi-clock'
                };
            case 'FAILED':
            case 'REJECTED':
                return {
                    status,
                    label: 'Failed',
                    severity: 'danger',
                    icon: 'pi pi-times-circle'
                };
            case 'EXPIRED':
                return {
                    status,
                    label: 'Expired',
                    severity: 'warning',
                    icon: 'pi pi-exclamation-triangle'
                };
            default:
                return {
                    status,
                    label: status || 'Unknown',
                    severity: 'info',
                    icon: 'pi pi-info-circle'
                };
        }
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    }

    getLatestVerificationStatus(): VerificationStatus | null {
        const requests = this.verificationRequests();
        if (requests.length === 0) return null;

        const latest = requests.sort((a, b) => {
            const dateA = a.verifiedAt ? new Date(a.verifiedAt.toString()).getTime() : 0;
            const dateB = b.verifiedAt ? new Date(b.verifiedAt.toString()).getTime() : 0;
            return dateB - dateA;
        })[0];

        return this.getVerificationStatus(latest.status || '');
    }

    hasVerifiedStatus(): boolean {
        const requests = this.verificationRequests();
        return requests.some((req) => req.status?.toUpperCase() === 'VERIFIED' || req.status?.toUpperCase() === 'COMPLETED');
    }
}
