import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-donor-recognition-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
    template: `
        <div class="donor-recognition-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title || 'Our Donors' }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div *ngIf="loading" class="text-center p-8">
                    <p class="text-muted">Loading donors...</p>
                </div>

                <div *ngIf="!loading && donors.length === 0" class="text-center p-8">
                    <p class="text-muted">No donors to display.</p>
                </div>

                <!-- Donor Wall by Recognition Level -->
                <div *ngFor="let level of recognitionLevels" class="mb-12">
                    <h3 class="text-center font-bold mb-6" [style.color]="config.levelTitleColor" [style.font-size.px]="config.levelTitleSize">
                        {{ level.name }}
                    </h3>

                    <div class="grid gap-4" [ngClass]="getGridClass(level.name)">
                        <div *ngFor="let donor of getDonorsByLevel(level.name)" class="donor-card rounded-lg p-6 text-center shadow-md" 
                            [style.background-color]="level.cardColor"
                            [style.border]="'3px solid ' + level.accentColor">
                            
                            <div class="donor-avatar mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold" 
                                [style.background-color]="level.accentColor">
                                {{ getInitials(donor.name) }}
                            </div>

                            <h4 class="font-bold mb-1" [style.color]="config.donorNameColor">
                                {{ !donor.isAnonymous ? donor.name : 'Anonymous Donor' }}
                            </h4>

                            <span class="inline-block px-2 py-1 rounded text-xs font-semibold mt-2" 
                                [style.background-color]="level.accentColor" 
                                [style.color]="config.levelBadgeTextColor">
                                {{ level.name }}
                            </span>

                            <p *ngIf="donor.donationAmount && !donor.isAnonymous" class="text-sm mt-3" [style.color]="config.amountColor">
                                Donated: {{ donor.donationAmount | currency:'ZAR':'symbol':'1.0-0' }}
                            </p>

                            <p *ngIf="donor.recognitionMessage" class="text-sm italic mt-3" [style.color]="config.messageColor">
                                "{{ donor.recognitionMessage }}"
                            </p>
                        </div>
                    </div>
                </div>

                <div *ngIf="config.showDonateButton && !loading" class="text-center mt-12">
                    <button pButton 
                        [label]="config.donateButtonText || 'Make a Donation'" 
                        [style.background-color]="config.donateButtonColor" 
                        [style.color]="config.donateButtonTextColor"
                        (click)="donate()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .donor-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .donor-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }
        .donor-avatar {
            font-size: 24px;
        }
    `]
})
export class NgoDonorRecognitionWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Our Donors',
        subtitle: 'With gratitude to those who support our mission',
        backgroundColor: '#f9fafb',
        padding: 40,
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        levelTitleColor: '#374151',
        levelTitleSize: 20,
        donorNameColor: '#111827',
        amountColor: '#059669',
        messageColor: '#6b7280',
        levelBadgeTextColor: '#ffffff',
        showDonateButton: true,
        donateButtonColor: '#059669',
        donateButtonTextColor: '#ffffff',
        donateButtonText: 'Make a Donation',
        donationUrl: '/ngo/donate'
    };

    donors: any[] = [];
    loading = true;

    recognitionLevels = [
        { name: 'Platinum', cardColor: '#fafafa', accentColor: '#6366f1', minAmount: 100000 },
        { name: 'Gold', cardColor: '#fffbeb', accentColor: '#f59e0b', minAmount: 50000 },
        { name: 'Silver', cardColor: '#f0f9ff', accentColor: '#06b6d4', minAmount: 20000 },
        { name: 'Bronze', cardColor: '#fef3c7', accentColor: '#d97706', minAmount: 10000 }
    ];

    constructor(private ngoService: NgoServiceProxy) {}

    ngOnInit(): void {
        this.loadDonors();
    }

    loadDonors(): void {
        this.loading = true;
        this.ngoService.getDonorRecognitions().subscribe({
            next: (data: any) => {
                this.donors = (data || []).sort((a: any, b: any) => (b.donationAmount || 0) - (a.donationAmount || 0));
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load donors:', error);
                this.loading = false;
            }
        });
    }

    getDonorsByLevel(level: string): any[] {
        const levelConfig = this.recognitionLevels.find(l => l.name === level);
        if (!levelConfig) return [];
        return this.donors.filter(d => (d.donationAmount || 0) >= levelConfig.minAmount);
    }

    getGridClass(level: string): string {
        const count = this.getDonorsByLevel(level).length;
        if (level === 'Platinum') return 'grid-cols-1 md:grid-cols-2';
        if (level === 'Gold') return 'grid-cols-2 md:grid-cols-3';
        return 'grid-cols-2 md:grid-cols-4';
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    donate(): void {
        window.location.href = this.config.donationUrl;
    }
}
