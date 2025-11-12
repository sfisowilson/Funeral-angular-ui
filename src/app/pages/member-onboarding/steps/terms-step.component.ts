import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { 
    TermsServiceProxy,
    TermsAndConditionsDto,
    AcceptTermsDto
} from '../../../core/services/service-proxies';

@Component({
    selector: 'app-terms-step',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CheckboxModule,
        CardModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './terms-step.component.html',
    styleUrl: './terms-step.component.scss'
})
export class TermsStepComponent implements OnInit {
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Input() hasAcceptedTerms?: boolean; // Passed from parent component
    @Output() stepComplete = new EventEmitter<void>();
    private stepCompleteSubject = new Subject<void>();

    activeTerms = signal<TermsAndConditionsDto | null>(null);
    hasAccepted = signal(false);
    loading = signal(false);
    accepting = signal(false);
    termsAccepted = false;

    constructor(
        private termsService: TermsServiceProxy,
        private messageService: MessageService
    ) {
        this.stepCompleteSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.stepComplete.emit();
        });
    }

    ngOnInit() {
        this.loadActiveTerms();
        
        // If hasAcceptedTerms is passed (e.g., from parent), use it
        if (this.hasAcceptedTerms !== undefined) {
            this.hasAccepted.set(this.hasAcceptedTerms);
            this.termsAccepted = this.hasAcceptedTerms;
        }
    }

    loadActiveTerms() {
        this.loading.set(true);
        this.termsService.terms_GetActive().subscribe({
            next: (data: any) => {
                this.activeTerms.set(data);
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading terms:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load terms and conditions'
                });
                this.loading.set(false);
            }
        });
    }

    checkIfAlreadyAccepted() {
        // Simplified - skip this check for now since API method doesn't exist
        // TODO: Implement when terms_HasAcceptedCurrent API is available
    }

    acceptTerms() {
        console.log('Accepting terms, termsAccepted:', this.termsAccepted); 
        if (!this.termsAccepted) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please check the box to accept the terms and conditions'
            });
            return;
        }

        const terms = this.activeTerms();
        if (!terms?.id) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No active terms found'
            });
            return;
        }

        this.accepting.set(true);
        const acceptDto: AcceptTermsDto = {
            termsAndConditionsId: terms.id
        } as any;

        this.termsService.terms_Accept(acceptDto).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'Terms and conditions accepted successfully' 
                });
                this.hasAccepted.set(true);
                this.stepCompleteSubject.next();
                this.accepting.set(false);
            },
            error: (error: any) => {
                console.error('Error accepting terms:', error);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Failed to accept terms' 
                });
                this.accepting.set(false);
            }
        });
    }

    formatDate(dateString?: string | any): string {
        if (!dateString) return 'N/A';
        // Handle luxon DateTime objects
        if (typeof dateString === 'object' && dateString.toJSDate) {
            return dateString.toJSDate().toLocaleDateString();
        }
        return new Date(dateString).toLocaleDateString();
    }
}
