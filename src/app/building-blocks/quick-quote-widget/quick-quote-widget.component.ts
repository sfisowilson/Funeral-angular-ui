import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'app-quick-quote-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, InputNumberModule, DropdownModule, ButtonModule, CalendarModule],
    template: `
        <div class="quick-quote-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto max-w-2xl">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div class="quote-form bg-white rounded-lg shadow-lg p-6" [style.background-color]="config.formBackgroundColor">
                    <form #quoteForm="ngForm" (ngSubmit)="onSubmit(quoteForm)">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label for="firstName" class="block mb-2 font-semibold" [style.color]="config.labelColor"> First Name * </label>
                                <input pInputText id="firstName" name="firstName" [(ngModel)]="formData.firstName" required class="w-full" />
                            </div>

                            <div class="field">
                                <label for="lastName" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Last Name * </label>
                                <input pInputText id="lastName" name="lastName" [(ngModel)]="formData.lastName" required class="w-full" />
                            </div>

                            <div class="field">
                                <label for="email" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Email Address * </label>
                                <input pInputText type="email" id="email" name="email" [(ngModel)]="formData.email" required class="w-full" />
                            </div>

                            <div class="field">
                                <label for="phone" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Phone Number </label>
                                <input pInputText id="phone" name="phone" [(ngModel)]="formData.phone" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="dateOfBirth" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Date of Birth </label>
                                <p-calendar id="dateOfBirth" name="dateOfBirth" [(ngModel)]="formData.dateOfBirth" [maxDate]="maxDate" dateFormat="yy-mm-dd" class="w-full" />
                            </div>

                            <div class="field">
                                <label for="coverageAmount" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Desired Coverage Amount </label>
                                <p-dropdown id="coverageAmount" name="coverageAmount" [(ngModel)]="formData.coverageAmount" [options]="coverageOptions" placeholder="Select amount" class="w-full" />
                            </div>
                        </div>

                        <div class="field mt-6">
                            <label for="additionalInfo" class="block mb-2 font-semibold" [style.color]="config.labelColor"> Additional Information </label>
                            <textarea
                                id="additionalInfo"
                                name="additionalInfo"
                                [(ngModel)]="formData.additionalInfo"
                                rows="3"
                                class="w-full p-3 border border-gray-300 rounded-md"
                                placeholder="Any additional information you'd like us to know..."
                            ></textarea>
                        </div>

                        <div class="text-center mt-6">
                            <button
                                pButton
                                type="submit"
                                [label]="config.buttonText || 'Get Quote'"
                                [disabled]="!quoteForm.valid"
                                [loading]="isSubmitting"
                                [style.background-color]="config.buttonColor"
                                [style.color]="config.buttonTextColor"
                                class="px-8 py-3"
                            ></button>
                        </div>
                    </form>

                    <div *ngIf="submitMessage" class="mt-4 p-4 rounded text-center" [class.bg-green-100]="submitSuccess" [class.bg-red-100]="!submitSuccess" [class.text-green-800]="submitSuccess" [class.text-red-800]="!submitSuccess">
                        {{ submitMessage }}
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .quote-form {
                transition: box-shadow 0.3s ease;
            }
            .quote-form:hover {
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
        `
    ]
})
export class QuickQuoteWidgetComponent {
    @Input() config: any = {};

    formData: any = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: null,
        coverageAmount: null,
        additionalInfo: ''
    };

    coverageOptions = [
        { label: 'R50,000', value: 50000 },
        { label: 'R100,000', value: 100000 },
        { label: 'R200,000', value: 200000 },
        { label: 'R300,000', value: 300000 },
        { label: 'R500,000', value: 500000 },
        { label: 'R1,000,000', value: 1000000 }
    ];

    maxDate = new Date();
    isSubmitting = false;
    submitMessage = '';
    submitSuccess = false;

    onSubmit(form: any): void {
        if (form.valid) {
            this.isSubmitting = true;

            // Simulate API call
            setTimeout(() => {
                this.isSubmitting = false;
                this.submitSuccess = true;
                this.submitMessage = this.config.successMessage || 'Thank you! We will contact you within 24 hours with your personalized quote.';

                // Reset form after successful submission
                setTimeout(() => {
                    form.resetForm();
                    this.formData = {
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        dateOfBirth: null,
                        coverageAmount: null,
                        additionalInfo: ''
                    };
                    this.submitMessage = '';
                }, 5000);
            }, 2000);
        }
    }
}
