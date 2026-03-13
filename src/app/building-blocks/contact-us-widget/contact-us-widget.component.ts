import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { ContactFormServiceProxy } from '../../core/services/service-proxies';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

interface Branch {
    name: string;
    address: string;
    phone: string;
    email: string;
    hours?: string;
    isPrimary?: boolean;
}

interface SocialMedia {
    platform: string;
    url: string;
    icon?: string;
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
    customStyles: SafeStyle = '';

    constructor(
        private fb: FormBuilder,
        private sanitizer: DomSanitizer,
        private contactFormService: ContactFormServiceProxy
    ) {}

    ngOnInit() {
        this.contactForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            subject: [''],
            message: ['', Validators.required]
        });
        this.applyCustomColors();
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

        this.contactFormService.submit(formData as any).subscribe({
            next: () => {
                this.successMessage = 'Thank you! Your message has been sent successfully.';
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

    private applyCustomColors(): void {
        const settings = this.config.settings || {};
        const cssVariables: string[] = [];

        // Set CSS variables for widget colors or theme fallbacks
        cssVariables.push(`--widget-primary-color: ${settings.primaryColor || 'var(--primary-color, #667eea)'}`);
        cssVariables.push(`--widget-secondary-color: ${settings.secondaryColor || 'var(--secondary-color, var(--accent-color, #764ba2))'}`);
        cssVariables.push(`--widget-text-color: ${settings.textColor || 'var(--text-color, #1a202c)'}`);
        cssVariables.push(`--widget-bg-color: ${settings.backgroundColor || 'var(--background-color, #ffffff)'}`);
        cssVariables.push(`--widget-text-muted: ${settings.textColor || 'var(--text-color-secondary, #718096)'}`);
        if (settings.padding != null) {
            cssVariables.push(`--widget-padding: ${settings.padding}px`);
        }

        this.customStyles = this.sanitizer.bypassSecurityTrustStyle(cssVariables.join('; '));
    }
}
