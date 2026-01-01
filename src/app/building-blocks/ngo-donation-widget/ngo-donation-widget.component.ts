import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-ngo-donation-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule],
    providers: [MessageService],
    template: `
        <div class="donation-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto max-w-3xl">
                <!-- Header -->
                <div class="text-center mb-8">
                    <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                        {{ config.title || 'Make a Donation' }}
                    </h2>
                    <p *ngIf="config.subtitle" class="text-center" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                        {{ config.subtitle }}
                    </p>
                </div>

                <!-- Donation Card -->
                <div class="donation-card rounded-lg p-8 shadow-lg" [style.background-color]="config.cardBackgroundColor">
                    <!-- Mission Statement -->
                    <p class="text-center mb-8 text-lg" [style.color]="config.missionColor">
                        {{ config.missionStatement || 'Your generous donation directly supports our mission to create meaningful change in our community.' }}
                    </p>

                    <!-- Preset Amounts -->
                    <div class="mb-8">
                        <p class="text-sm font-semibold mb-4" [style.color]="config.labelColor">Quick Donation Amounts</p>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button *ngFor="let amount of presetAmounts" 
                                pButton 
                                [label]="'R' + amount"
                                severity="secondary"
                                size="small"
                                class="w-full"
                                [style.background-color]="config.amountButtonColor"
                                [style.color]="config.amountButtonTextColor"
                                (click)="selectAmount(amount)"></button>
                        </div>
                    </div>

                    <!-- Custom Amount -->
                    <div class="mb-8">
                        <label class="block text-sm font-semibold mb-2" [style.color]="config.labelColor">
                            Custom Amount (ZAR)
                        </label>
                        <div class="flex gap-2">
                            <input 
                                type="number" 
                                [(ngModel)]="customAmount"
                                placeholder="Enter amount"
                                class="flex-1 px-4 py-2 border rounded-lg"
                                [style.border-color]="config.inputBorderColor"
                                [style.color]="config.labelColor"
                                min="1"
                            />
                            <button pButton 
                                icon="pi pi-check"
                                severity="success"
                                (click)="setCustomAmount()"></button>
                        </div>
                    </div>

                    <!-- Selected Amount Display -->
                    <div *ngIf="selectedAmount > 0" class="text-center mb-8 p-4 rounded" 
                        [style.background-color]="config.amountDisplayBackgroundColor">
                        <p class="text-sm" [style.color]="config.labelColor">Donation Amount</p>
                        <p class="text-3xl font-bold" [style.color]="config.accentColor">
                            R{{ selectedAmount }}
                        </p>
                    </div>

                    <!-- Impact Message -->
                    <div *ngIf="selectedAmount > 0" class="mb-8 p-4 rounded" 
                        [style.background-color]="config.impactBackgroundColor">
                        <p class="text-sm" [style.color]="config.impactTextColor">
                            {{ getImpactMessage(selectedAmount) }}
                        </p>
                    </div>

                    <!-- Payment Method Selection -->
                    <div class="mb-8">
                        <p class="text-sm font-semibold mb-4" [style.color]="config.labelColor">Choose Payment Method</p>
                        <div class="space-y-2">
                            <button *ngFor="let gateway of paymentGateways" 
                                pButton 
                                [label]="gateway.name"
                                [style.background-color]="selectedGateway === gateway.code ? config.accentColor : config.gatewayButtonColor"
                                [style.color]="selectedGateway === gateway.code ? config.accentButtonTextColor : config.gatewayButtonTextColor"
                                severity="secondary"
                                class="w-full justify-start"
                                (click)="selectGateway(gateway.code)"></button>
                        </div>
                    </div>

                    <!-- Donation Frequency -->
                    <div class="mb-8">
                        <p class="text-sm font-semibold mb-4" [style.color]="config.labelColor">Donation Frequency</p>
                        <div class="flex gap-2">
                            <button pButton 
                                label="One-time"
                                severity="secondary"
                                [style.background-color]="isRecurring === false ? config.accentColor : config.frequencyButtonColor"
                                [style.color]="isRecurring === false ? config.accentButtonTextColor : config.frequencyButtonTextColor"
                                (click)="setRecurring(false)"></button>
                            <button pButton 
                                label="Monthly"
                                severity="secondary"
                                [style.background-color]="isRecurring === true ? config.accentColor : config.frequencyButtonColor"
                                [style.color]="isRecurring === true ? config.accentButtonTextColor : config.frequencyButtonTextColor"
                                (click)="setRecurring(true)"></button>
                        </div>
                    </div>

                    <!-- Privacy Notice -->
                    <div class="mb-8 text-xs" [style.color]="config.disclaimerColor">
                        <p>{{ config.privacyNotice || 'Your donation is secure and your privacy is protected. We never share your information.' }}</p>
                    </div>

                    <!-- Donate Button -->
                    <button *ngIf="selectedAmount > 0" pButton 
                        [label]="getDonateButtonLabel()"
                        size="large"
                        class="w-full"
                        [style.background-color]="config.donateButtonColor" 
                        [style.color]="config.donateButtonTextColor"
                        (click)="processDonation()"></button>

                    <p *ngIf="selectedAmount === 0" class="text-center text-sm" [style.color]="config.disclaimerColor">
                        Please select or enter a donation amount to continue.
                    </p>
                </div>

                <!-- Donation Impact Stats -->
                <div *ngIf="config.showImpactStats" class="mt-12 grid grid-cols-3 gap-6 text-center">
                    <div>
                        <p class="text-3xl font-bold" [style.color]="config.accentColor">{{ config.totalDonations }}</p>
                        <p class="text-sm" [style.color]="config.labelColor">Total Raised</p>
                    </div>
                    <div>
                        <p class="text-3xl font-bold" [style.color]="config.accentColor">{{ config.donorCount }}</p>
                        <p class="text-sm" [style.color]="config.labelColor">Donors</p>
                    </div>
                    <div>
                        <p class="text-3xl font-bold" [style.color]="config.accentColor">{{ config.projectsSupported }}</p>
                        <p class="text-sm" [style.color]="config.labelColor">Projects Supported</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .donation-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .donation-card:hover {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        input[type="number"] {
            font-size: 16px;
        }
        input[type="number"]::placeholder {
            opacity: 0.5;
        }
    `]
})
export class NgoDonationWidgetComponent {
    @Input() config: any = {
        title: 'Make a Donation',
        subtitle: 'Support our mission and create lasting change',
        backgroundColor: '#f9fafb',
        padding: 40,
        cardBackgroundColor: '#ffffff',
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        labelColor: '#374151',
        missionColor: '#4b5563',
        accentColor: '#059669',
        accentButtonTextColor: '#ffffff',
        amountButtonColor: '#e0f2fe',
        amountButtonTextColor: '#0369a1',
        amountDisplayBackgroundColor: '#dcfce7',
        impactBackgroundColor: '#fef3c7',
        impactTextColor: '#92400e',
        gatewayButtonColor: '#f3f4f6',
        gatewayButtonTextColor: '#374151',
        frequencyButtonColor: '#f3f4f6',
        frequencyButtonTextColor: '#374151',
        donateButtonColor: '#059669',
        donateButtonTextColor: '#ffffff',
        disclaimerColor: '#9ca3af',
        inputBorderColor: '#d1d5db',
        privacyNotice: 'Your donation is secure and your privacy is protected. We never share your information.',
        missionStatement: 'Your generous donation directly supports our mission to create meaningful change in our community.',
        showImpactStats: true,
        totalDonations: 'R245,000',
        donorCount: '1,234',
        projectsSupported: '42',
        donationUrl: '/ngo/donate'
    };

    presetAmounts = [100, 250, 500, 1000, 2500, 5000];
    paymentGateways = [
        { code: 'paypal', name: 'PayPal' },
        { code: 'stripe', name: 'Stripe' },
        { code: 'payfast', name: 'PayFast' },
        { code: 'square', name: 'Square' },
        { code: 'paystack', name: 'Paystack' }
    ];

    selectedAmount = 0;
    customAmount: number | null = null;
    selectedGateway = 'paypal';
    isRecurring = false;

    constructor(private messageService: MessageService) {}

    selectAmount(amount: number): void {
        this.selectedAmount = amount;
        this.customAmount = null;
    }

    setCustomAmount(): void {
        if (this.customAmount && this.customAmount > 0) {
            this.selectedAmount = this.customAmount;
        }
    }

    selectGateway(gatewayCode: string): void {
        this.selectedGateway = gatewayCode;
    }

    setRecurring(recurring: boolean): void {
        this.isRecurring = recurring;
    }

    getDonateButtonLabel(): string {
        if (!this.selectedAmount) return 'Donate';
        const frequency = this.isRecurring ? 'Monthly' : 'One-time';
        return `Donate R${this.selectedAmount} (${frequency})`;
    }

    getImpactMessage(amount: number): string {
        if (amount < 250) {
            return `Your donation of R${amount} will help us continue our essential services.`;
        } else if (amount < 1000) {
            return `Your generous donation of R${amount} will directly support multiple projects in our community.`;
        } else if (amount < 5000) {
            return `Your substantial donation of R${amount} will create lasting impact and change lives.`;
        } else {
            return `Your exceptional donation of R${amount} will be transformative for our organization and the communities we serve.`;
        }
    }

    processDonation(): void {
        if (this.selectedAmount <= 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Amount',
                detail: 'Please select or enter a valid donation amount.'
            });
            return;
        }

        // Build donation URL with parameters
        const params = new URLSearchParams({
            amount: this.selectedAmount.toString(),
            gateway: this.selectedGateway,
            recurring: this.isRecurring.toString()
        });

        // Redirect to donation processing page
        window.location.href = `${this.config.donationUrl}?${params.toString()}`;
    }
}
