import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { EditorModule } from 'primeng/editor';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TermsService } from '../../../core/services/generated/terms/terms.service';
import { TermsAndConditionsDto } from '../../../core/models';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-terms-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        CheckboxModule,
        CalendarModule,
        EditorModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './terms-management.component.html',
    styleUrl: './terms-management.component.scss'
})
export class TermsManagementComponent implements OnInit {
    terms = signal<TermsAndConditionsDto[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    isEditMode = signal(false);
    
    currentTerm: TermsAndConditionsDto = {} as TermsAndConditionsDto;

    constructor(
        private termsService: TermsService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadTerms();
    }

    loadTerms() {
        this.loading.set(true);
        this.termsService.getApiTermsTermsGetAll().subscribe({
            next: (result) => {
                this.terms.set(result);
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

    openNewDialog() {
        this.currentTerm = {
            id: '00000000-0000-0000-0000-000000000000',
            tenantId: '',
            title: '',
            content: '',
            version: '1.0',
            isActive: true,
            effectiveDate: new Date() as any,
            expiryDate: null as any,
            createdAt: new Date() as any,
            updatedAt: new Date() as any
        } as TermsAndConditionsDto;
        this.isEditMode.set(false);
        this.showDialog.set(true);
    }

    editTerm(term: TermsAndConditionsDto) {
        this.currentTerm = { ...term };
        this.isEditMode.set(true);
        this.showDialog.set(true);
    }

    saveTerm() {
        if (!this.currentTerm.title || !this.currentTerm.content) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        // Prepare DTO with properly formatted dates
        const payload = {
            id: this.currentTerm.id,
            title: this.currentTerm.title,
            content: this.currentTerm.content,
            version: this.currentTerm.version,
            isActive: this.currentTerm.isActive,
            effectiveDate: this.currentTerm.effectiveDate 
                ? (typeof this.currentTerm.effectiveDate === 'string' 
                    ? this.currentTerm.effectiveDate
                    : new Date(this.currentTerm.effectiveDate as any).toISOString())
                : new Date().toISOString(),
            expiryDate: this.currentTerm.expiryDate 
                ? (typeof this.currentTerm.expiryDate === 'string' 
                    ? this.currentTerm.expiryDate
                    : new Date(this.currentTerm.expiryDate as any).toISOString())
                : null
        };

        this.loading.set(true);
        this.termsService.postApiTermsTermsCreate(payload as any).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Terms and conditions saved successfully'
                });
                this.showDialog.set(false);
                this.loadTerms();
            },
            error: (error: any) => {
                console.error('Error saving terms:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save terms and conditions'
                });
                this.loading.set(false);
            }
        });
    }

    cancel() {
        this.showDialog.set(false);
    }

    formatDate(date: DateTime | Date | undefined): string {
        if (!date) return 'N/A';
        
        if (date instanceof DateTime) {
            return date.toFormat('MMM dd, yyyy');
        }
        
        if (date instanceof Date) {
            return DateTime.fromJSDate(date).toFormat('MMM dd, yyyy');
        }
        
        // Handle string dates from API
        return DateTime.fromISO(date as any).toFormat('MMM dd, yyyy');
    }
}
