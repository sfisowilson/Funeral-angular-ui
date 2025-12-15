import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WidgetConfig } from '../widget-config';
import { API_BASE_URL } from '../../core/services/service-proxies';

interface Branch {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface SocialMedia {
    platform: string;
    url: string;
}

@Component({
    selector: 'app-contact-us-widget',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact-us-widget.component.html',
    styleUrls: ['./contact-us-widget.component.scss']
})
export class ContactUsWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;
    contactForm!: FormGroup;
    isSubmitting = false;
    successMessage = '';
    errorMessage = '';
    baseUrl: string;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        @Inject(API_BASE_URL) baseUrl?: string
    ) {
        this.baseUrl = baseUrl ?? '';
    }

    ngOnInit() {
        this.contactForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            subject: [''],
            message: ['', Validators.required]
        });
    }

    get branches(): Branch[] {
        return this.config.settings.branches || [];
    }

    get socialMediaHandles(): SocialMedia[] {
        return this.config.settings.socialMediaHandles || [];
    }

    submitForm() {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.successMessage = '';
        this.errorMessage = '';

        // Get subdomain from URL
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        const formData = {
            ...this.contactForm.value,
            tenantSubdomain: subdomain
        };

        this.http.post(`${this.baseUrl}/api/ContactForm/submit`, formData).subscribe({
            next: (response: any) => {
                this.successMessage = response.message || 'Thank you! Your message has been sent successfully.';
                this.contactForm.reset();
                this.isSubmitting = false;

                // Clear success message after 5 seconds
                setTimeout(() => {
                    this.successMessage = '';
                }, 5000);
            },
            error: (error) => {
                this.errorMessage = error.error?.error || 'An error occurred while sending your message. Please try again later.';
                this.isSubmitting = false;

                // Clear error message after 7 seconds
                setTimeout(() => {
                    this.errorMessage = '';
                }, 7000);
            }
        });
    }
}
