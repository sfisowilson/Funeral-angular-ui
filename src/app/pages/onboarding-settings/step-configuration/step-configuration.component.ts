import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';

// Temporary interface until proxies are regenerated
interface OnboardingStepConfigurationDto {
    id?: string;
    tenantId?: string;
    stepKey: string;
    stepLabel: string;
    tenantTypeFilter?: string;
    componentType: string;
    displayOrder: number;
    isRequired: boolean;
    isEnabled: boolean;
    description?: string;
    icon?: string;
    validationRulesJson?: string;
    isSkippable: boolean;
}

@Component({
    selector: 'app-step-configuration',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
        <div class="step-configuration-container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="mb-1">Onboarding Step Configuration</h4>
                    <p class="text-muted mb-0">Configure which steps appear in the member onboarding flow based on your organization type</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm" (click)="initializeDefaults()" [disabled]="loading()">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Initialize Defaults
                    </button>
                    <button class="btn btn-primary btn-sm" (click)="openCreateDialog()">
                        <i class="bi bi-plus-circle me-1"></i>
                        Add Step
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading()" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>

            <!-- Steps Table -->
            <div *ngIf="!loading()" class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th style="width: 50px">#</th>
                            <th>Step</th>
                            <th>Component</th>
                            <th>Tenant Types</th>
                            <th style="width: 120px">Required</th>
                            <th style="width: 120px">Enabled</th>
                            <th style="width: 120px">Skippable</th>
                            <th style="width: 150px">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let step of steps(); let i = index">
                            <td>
                                <div class="d-flex flex-column gap-1">
                                    <button 
                                        class="btn btn-sm btn-outline-secondary p-1" 
                                        [disabled]="i === 0"
                                        (click)="moveUp(i)"
                                        title="Move up">
                                        <i class="bi bi-arrow-up"></i>
                                    </button>
                                    <button 
                                        class="btn btn-sm btn-outline-secondary p-1" 
                                        [disabled]="i === steps().length - 1"
                                        (click)="moveDown(i)"
                                        title="Move down">
                                        <i class="bi bi-arrow-down"></i>
                                    </button>
                                </div>
                            </td>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <i [class]="step.icon || 'bi bi-circle'" class="text-primary"></i>
                                    <div>
                                        <div class="fw-semibold">{{ step.stepLabel }}</div>
                                        <small class="text-muted">{{ step.stepKey }}</small>
                                    </div>
                                </div>
                            </td>
                            <td><code class="small">{{ step.componentType }}</code></td>
                            <td>
                                <span *ngIf="!step.tenantTypeFilter" class="badge bg-secondary">All Types</span>
                                <span *ngIf="step.tenantTypeFilter" class="badge bg-info">{{ step.tenantTypeFilter }}</span>
                            </td>
                            <td>
                                <div class="form-check form-switch">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        [checked]="step.isRequired"
                                        (change)="toggleRequired(step)"
                                        [id]="'required-' + step.id">
                                </div>
                            </td>
                            <td>
                                <div class="form-check form-switch">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        [checked]="step.isEnabled"
                                        (change)="toggleEnabled(step)"
                                        [id]="'enabled-' + step.id">
                                </div>
                            </td>
                            <td>
                                <div class="form-check form-switch">
                                    <input 
                                        class="form-check-input" 
                                        type="checkbox" 
                                        [checked]="step.isSkippable"
                                        (change)="toggleSkippable(step)"
                                        [id]="'skippable-' + step.id">
                                </div>
                            </td>
                            <td>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" (click)="openEditDialog(step)" title="Edit">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" (click)="deleteStep(step)" title="Delete">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div *ngIf="steps().length === 0" class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    No onboarding steps configured. Click "Initialize Defaults" to create default steps based on your organization type.
                </div>
            </div>

            <!-- Edit/Create Dialog -->
            <div class="modal fade" [class.show]="showDialog()" [style.display]="showDialog() ? 'block' : 'none'" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ isEditing() ? 'Edit Step' : 'Create Step' }}</h5>
                            <button type="button" class="btn-close" (click)="closeDialog()"></button>
                        </div>
                        <form [formGroup]="stepForm" (ngSubmit)="saveStep()">
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Step Key *</label>
                                        <input type="text" class="form-control" formControlName="stepKey" placeholder="e.g., personal-info">
                                        <small class="text-muted">Unique identifier for the step</small>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Step Label *</label>
                                        <input type="text" class="form-control" formControlName="stepLabel" placeholder="e.g., Personal Information">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Component Type *</label>
                                        <select class="form-select" formControlName="componentType">
                                            <option value="">Select component...</option>
                                            <option value="PersonalInfoStepComponent">Personal Info Step</option>
                                            <option value="DependentsStepComponent">Dependents Step</option>
                                            <option value="BeneficiariesStepComponent">Beneficiaries Step</option>
                                            <option value="BankingDetailsStepComponent">Banking Details Step</option>
                                            <option value="TermsStepComponent">Terms Step</option>
                                            <option value="SummaryStepComponent">Summary Step</option>
                                            <option value="CompleteStepComponent">Complete Step</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Icon Class</label>
                                        <input type="text" class="form-control" formControlName="icon" placeholder="e.g., bi bi-person or pi pi-user">
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label">Tenant Type Filter</label>
                                        <input type="text" class="form-control" formControlName="tenantTypeFilter" 
                                               placeholder="Leave empty for all types, or comma-separated: FuneralParlour,BurialSociety">
                                        <small class="text-muted">Leave empty to show for all tenant types</small>
                                    </div>
                                    <div class="col-md-12">
                                        <label class="form-label">Description</label>
                                        <textarea class="form-control" formControlName="description" rows="2" 
                                                  placeholder="Brief description of this step"></textarea>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" formControlName="isRequired" id="isRequired">
                                            <label class="form-check-label" for="isRequired">
                                                Required
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" formControlName="isEnabled" id="isEnabled">
                                            <label class="form-check-label" for="isEnabled">
                                                Enabled
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" formControlName="isSkippable" id="isSkippable">
                                            <label class="form-check-label" for="isSkippable">
                                                Skippable
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" (click)="closeDialog()">Cancel</button>
                                <button type="submit" class="btn btn-primary" [disabled]="!stepForm.valid || saving()">
                                    <span *ngIf="saving()" class="spinner-border spinner-border-sm me-2"></span>
                                    {{ isEditing() ? 'Update' : 'Create' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade" [class.show]="showDialog()" *ngIf="showDialog()"></div>
        </div>
    `,
    styles: [`
        .step-configuration-container {
            padding: 1rem;
        }
        
        .modal {
            background: rgba(0, 0, 0, 0.5);
        }
        
        .modal.show {
            display: block !important;
        }
    `],
    providers: [MessageService]
})
export class StepConfigurationComponent implements OnInit {
    steps = signal<OnboardingStepConfigurationDto[]>([]);
    loading = signal(false);
    saving = signal(false);
    showDialog = signal(false);
    isEditing = signal(false);
    selectedStep = signal<OnboardingStepConfigurationDto | null>(null);
    
    stepForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.initializeForm();
    }

    ngOnInit() {
        this.loadSteps();
    }

    initializeForm() {
        this.stepForm = this.fb.group({
            stepKey: ['', Validators.required],
            stepLabel: ['', Validators.required],
            componentType: ['', Validators.required],
            tenantTypeFilter: [''],
            icon: [''],
            description: [''],
            isRequired: [true],
            isEnabled: [true],
            isSkippable: [false],
            displayOrder: [0]
        });
    }

    loadSteps() {
        this.loading.set(true);
        // TODO: Replace with actual API call when proxies are regenerated
        // this.stepConfigService.onboardingStepConfiguration_GetAll().subscribe({
        //     next: (steps) => {
        //         this.steps.set(steps);
        //         this.loading.set(false);
        //     },
        //     error: (error) => {
        //         console.error('Error loading steps:', error);
        //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load step configurations' });
        //         this.loading.set(false);
        //     }
        // });
        
        // Mock data for now
        setTimeout(() => {
            this.steps.set([]);
            this.loading.set(false);
        }, 500);
    }

    initializeDefaults() {
        if (!confirm('This will create default onboarding steps for your organization type. Continue?')) {
            return;
        }
        
        this.loading.set(true);
        // TODO: Replace with actual API call
        // this.stepConfigService.onboardingStepConfiguration_InitializeDefaults().subscribe({
        //     next: () => {
        //         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Default steps initialized' });
        //         this.loadSteps();
        //     },
        //     error: (error) => {
        //         console.error('Error initializing defaults:', error);
        //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initialize defaults' });
        //         this.loading.set(false);
        //     }
        // });
        
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Backend API integration pending - please run backend to test' });
        this.loading.set(false);
    }

    openCreateDialog() {
        this.isEditing.set(false);
        this.selectedStep.set(null);
        this.stepForm.reset({
            isRequired: true,
            isEnabled: true,
            isSkippable: false,
            displayOrder: this.steps().length + 1
        });
        this.showDialog.set(true);
    }

    openEditDialog(step: OnboardingStepConfigurationDto) {
        this.isEditing.set(true);
        this.selectedStep.set(step);
        this.stepForm.patchValue(step);
        this.showDialog.set(true);
    }

    closeDialog() {
        this.showDialog.set(false);
        this.selectedStep.set(null);
        this.stepForm.reset();
    }

    saveStep() {
        if (!this.stepForm.valid) return;

        this.saving.set(true);
        const formValue = this.stepForm.value;

        if (this.isEditing()) {
            // TODO: Update step
            this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Update API pending' });
            this.saving.set(false);
            this.closeDialog();
        } else {
            // TODO: Create step
            this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Create API pending' });
            this.saving.set(false);
            this.closeDialog();
        }
    }

    toggleRequired(step: OnboardingStepConfigurationDto) {
        step.isRequired = !step.isRequired;
        // TODO: Update via API
        this.messageService.add({ severity: 'info', summary: 'Updated', detail: `Step ${step.isRequired ? 'marked as required' : 'marked as optional'}` });
    }

    toggleEnabled(step: OnboardingStepConfigurationDto) {
        step.isEnabled = !step.isEnabled;
        // TODO: Update via API
        this.messageService.add({ severity: 'info', summary: 'Updated', detail: `Step ${step.isEnabled ? 'enabled' : 'disabled'}` });
    }

    toggleSkippable(step: OnboardingStepConfigurationDto) {
        step.isSkippable = !step.isSkippable;
        // TODO: Update via API
        this.messageService.add({ severity: 'info', summary: 'Updated', detail: `Step ${step.isSkippable ? 'marked as skippable' : 'marked as not skippable'}` });
    }

    moveUp(index: number) {
        if (index === 0) return;
        const newSteps = [...this.steps()];
        [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
        this.steps.set(newSteps);
        this.updateOrder();
    }

    moveDown(index: number) {
        if (index === this.steps().length - 1) return;
        const newSteps = [...this.steps()];
        [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
        this.steps.set(newSteps);
        this.updateOrder();
    }

    updateOrder() {
        // TODO: Send reorder request to API
        const reorderDto = {
            stepOrders: this.steps().map((step, index) => ({
                id: step.id,
                displayOrder: index + 1
            }))
        };
        console.log('Reorder DTO:', reorderDto);
    }

    deleteStep(step: OnboardingStepConfigurationDto) {
        if (!confirm(`Delete step "${step.stepLabel}"?`)) return;
        
        // TODO: Delete via API
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Delete API pending' });
    }
}
