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










// Legacy terms onboarding step component has been removed.
// Terms acceptance should now be managed via dynamic forms/widgets.

export {};
}
