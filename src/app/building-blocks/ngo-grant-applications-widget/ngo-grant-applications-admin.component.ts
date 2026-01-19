import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgoServiceProxy } from '../../core/services/service-proxies';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'app-ngo-grant-applications-admin',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        DialogModule,
        TableModule,
        ConfirmDialogModule,
        ToastModule,
        CalendarModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="container-fluid p-4">
            <div class="row mb-4">
                <div class="col-12">
                    <h1 class="h3 mb-1">Grant Applications Management</h1>
                    <p class="text-muted small">Add and manage funding opportunities for donors</p>
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-12">
                    <button class="btn btn-primary" 
                        (click)="openAddDialog()">
                        <i class="bi bi-plus-circle me-2"></i>Add New Grant Application
                    </button>
                </div>
            </div>

            <!-- Grant Applications Table -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body table-responsive">
                            <table class="table table-hover table-striped">
                                <thead class="table-light">
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Organization</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Requested Amount</th>
                                        <th>Approved Amount</th>
                                        <th>Timeline</th>
                                        <th style="width: 120px">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let app of applications">
                                        <td class="fw-medium">{{ app.projectName }}</td>
                                        <td>{{ app.organizationName }}</td>
                                        <td>{{ app.contactPerson }}</td>
                                        <td>
                                            <span [ngClass]="'badge bg-' + getStatusBadgeClass(app.status)">
                                                {{ formatStatus(app.status) }}
                                            </span>
                                        </td>
                                        <td>{{ app.requestedAmount | currency:'ZAR':'symbol':'1.0-0' }}</td>
                                        <td>{{ app.approvedAmount | currency:'ZAR':'symbol':'1.0-0' }}</td>
                                        <td class="small">{{ app.timeline }}</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary me-1" 
                                                title="Edit"
                                                (click)="openEditDialog(app)">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" 
                                                title="Delete"
                                                (click)="deleteGrant(app)">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr *ngIf="applications.length === 0">
                                        <td colspan="8" class="text-center text-muted py-4">
                                            No grant applications found. Click "Add New Grant Application" to create one.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Modal -->
        <div class="modal fade" [class.show]="displayDialog" [style.display]="displayDialog ? 'block' : 'none'">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ dialogTitle }}</h5>
                        <button type="button" class="btn-close" (click)="displayDialog = false"></button>
                    </div>
                    <div class="modal-body">
                        <form [formGroup]="grantForm">
                            <!-- Organization Section -->
                            <div class="mb-3">
                                <label class="form-label fw-semibold text-secondary">Organization Information</label>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Organization Name <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" formControlName="organizationName"
                                            [class.is-invalid]="grantForm.get('organizationName')?.hasError('required') && grantForm.get('organizationName')?.touched" />
                                        <small class="text-danger" *ngIf="grantForm.get('organizationName')?.hasError('required') && grantForm.get('organizationName')?.touched">
                                            Organization name is required
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Contact Person <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" formControlName="contactPerson"
                                            [class.is-invalid]="grantForm.get('contactPerson')?.hasError('required') && grantForm.get('contactPerson')?.touched" />
                                        <small class="text-danger" *ngIf="grantForm.get('contactPerson')?.hasError('required') && grantForm.get('contactPerson')?.touched">
                                            Contact person is required
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Email <span class="text-danger">*</span></label>
                                        <input type="email" class="form-control" formControlName="email"
                                            [class.is-invalid]="(grantForm.get('email')?.hasError('required') || grantForm.get('email')?.hasError('email')) && grantForm.get('email')?.touched" />
                                        <small class="text-danger" *ngIf="grantForm.get('email')?.hasError('required') && grantForm.get('email')?.touched">
                                            Email is required
                                        </small>
                                        <small class="text-danger" *ngIf="grantForm.get('email')?.hasError('email') && grantForm.get('email')?.touched">
                                            Invalid email format
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Phone</label>
                                        <input type="text" class="form-control" formControlName="phone" />
                                    </div>
                                </div>
                            </div>

                            <!-- Project Section -->
                            <div class="mb-3 mt-4">
                                <label class="form-label fw-semibold text-secondary">Project Information</label>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Project Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" formControlName="projectName"
                                    [class.is-invalid]="grantForm.get('projectName')?.hasError('required') && grantForm.get('projectName')?.touched" />
                                <small class="text-danger" *ngIf="grantForm.get('projectName')?.hasError('required') && grantForm.get('projectName')?.touched">
                                    Project name is required
                                </small>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Project Description <span class="text-danger">*</span></label>
                                <textarea class="form-control" formControlName="projectDescription" rows="3"
                                    [class.is-invalid]="grantForm.get('projectDescription')?.hasError('required') && grantForm.get('projectDescription')?.touched"></textarea>
                                <small class="text-danger" *ngIf="grantForm.get('projectDescription')?.hasError('required') && grantForm.get('projectDescription')?.touched">
                                    Description is required
                                </small>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Project Category <span class="text-danger">*</span></label>
                                        <select class="form-select" formControlName="projectCategory"
                                            [class.is-invalid]="grantForm.get('projectCategory')?.hasError('required') && grantForm.get('projectCategory')?.touched">
                                            <option value="">Select category</option>
                                            <option *ngFor="let cat of categoryOptions" [value]="cat.value">
                                                {{ cat.label }}
                                            </option>
                                        </select>
                                        <small class="text-danger" *ngIf="grantForm.get('projectCategory')?.hasError('required') && grantForm.get('projectCategory')?.touched">
                                            Category is required
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Status <span class="text-danger">*</span></label>
                                        <select class="form-select" formControlName="status">
                                            <option *ngFor="let status of statusOptions" [value]="status.value">
                                                {{ status.label }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Financial Section -->
                            <div class="mb-3 mt-4">
                                <label class="form-label fw-semibold text-secondary">Financial Information</label>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Requested Amount (ZAR) <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" formControlName="requestedAmount"
                                            [class.is-invalid]="grantForm.get('requestedAmount')?.hasError('required') && grantForm.get('requestedAmount')?.touched" />
                                        <small class="text-danger" *ngIf="grantForm.get('requestedAmount')?.hasError('required') && grantForm.get('requestedAmount')?.touched">
                                            Amount is required
                                        </small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Approved Amount (ZAR) <span class="text-danger">*</span></label>
                                        <input type="number" class="form-control" formControlName="approvedAmount"
                                            [class.is-invalid]="grantForm.get('approvedAmount')?.hasError('required') && grantForm.get('approvedAmount')?.touched" />
                                        <small class="text-danger" *ngIf="grantForm.get('approvedAmount')?.hasError('required') && grantForm.get('approvedAmount')?.touched">
                                            Amount is required
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <!-- Timeline & Additional -->
                            <div class="mb-3 mt-4">
                                <label class="form-label fw-semibold text-secondary">Timeline & Additional Info</label>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Project Timeline <span class="text-danger">*</span></label>
                                <textarea class="form-control" formControlName="timeline" rows="2" 
                                    placeholder="e.g., 6 months, Q1-Q2 2026"
                                    [class.is-invalid]="grantForm.get('timeline')?.hasError('required') && grantForm.get('timeline')?.touched"></textarea>
                                <small class="text-danger" *ngIf="grantForm.get('timeline')?.hasError('required') && grantForm.get('timeline')?.touched">
                                    Timeline is required
                                </small>
                            </div>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Application Deadline</label>
                                        <input type="date" class="form-control" formControlName="deadline" />
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Application/Donation URL</label>
                                        <input type="url" class="form-control" formControlName="applicationUrl"
                                            placeholder="https://..." />
                                        <small class="form-text text-muted">Where donors/applicants should go to donate or apply</small>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" formControlName="notes" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" (click)="displayDialog = false">Cancel</button>
                        <button type="button" class="btn btn-primary" (click)="saveGrant()" [disabled]="grantForm.invalid">
                            {{ editingId ? 'Update' : 'Add' }} Grant Application
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Backdrop -->
        <div class="modal-backdrop fade" [class.show]="displayDialog" *ngIf="displayDialog"></div>
    `,
    styles: [`
        .modal.show {
            display: block;
        }
        .form-label {
            margin-bottom: 0.5rem;
        }
    `]
})
export class NgoGrantApplicationsAdminComponent implements OnInit {
    applications: any[] = [];
    displayDialog = false;
    editingId: string | null = null;
    grantForm: FormGroup;
    dialogTitle = 'Add New Grant Application';

    statusOptions = [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under Review', value: 'under-review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Completed', value: 'completed' }
    ];

    categoryOptions = [
        { label: 'Education', value: 'Education' },
        { label: 'Healthcare', value: 'Healthcare' },
        { label: 'Community Development', value: 'Community Development' },
        { label: 'Infrastructure', value: 'Infrastructure' },
        { label: 'Environmental', value: 'Environmental' },
        { label: 'Other', value: 'Other' }
    ];

    constructor(
        private fb: FormBuilder,
        private ngoService: NgoServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.grantForm = this.fb.group({
            organizationName: ['', Validators.required],
            contactPerson: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            projectName: ['', Validators.required],
            projectDescription: ['', Validators.required],
            projectCategory: ['', Validators.required],
            requestedAmount: [0, [Validators.required, Validators.min(0)]],
            approvedAmount: [0, [Validators.required, Validators.min(0)]],
            timeline: ['', Validators.required],
            status: ['submitted', Validators.required],
            notes: [''],
            deadline: [null],
            applicationUrl: ['']
        });
    }

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.ngoService.get_GrantApplications().subscribe({
            next: (response: any) => {
                this.applications = response?.result || response || [];
                console.log('Loaded applications:', this.applications);
            },
            error: (error) => {
                console.error('Failed to load grant applications:', error);
                this.applications = [];
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load grant applications'
                });
            }
        });
    }

    openAddDialog(): void {
        this.editingId = null;
        this.dialogTitle = 'Add New Grant Application';
        this.grantForm.reset({ status: 'under-review' });
        this.displayDialog = true;
    }

    openEditDialog(app: any): void {
        this.editingId = app.id;
        this.dialogTitle = 'Edit Grant Application';
        this.grantForm.patchValue({
            organizationName: app.organizationName || '',
            contactPerson: app.contactPerson || '',
            email: app.email || '',
            phone: app.phone || '',
            projectName: app.projectName || '',
            projectDescription: app.projectDescription || '',
            projectCategory: app.projectCategory || '',
            requestedAmount: app.requestedAmount || 0,
            approvedAmount: app.approvedAmount || 0,
            timeline: app.timeline || '',
            status: app.status || 'submitted',
            notes: app.notes || '',
            deadline: app.deadline ? new Date(app.deadline) : null,
            applicationUrl: app.applicationUrl || ''
        });
        this.displayDialog = true;
    }

    saveGrant(): void {
        if (this.grantForm.valid) {
            const grantData = this.grantForm.value;

            if (this.editingId) {
                // Update existing grant
                this.ngoService.update_GrantApplication(Number(this.editingId), grantData).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Grant application updated successfully'
                        });
                        this.displayDialog = false;
                        this.loadApplications();
                    },
                    error: (error) => {
                        console.error('Failed to update grant application:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to update grant application'
                        });
                    }
                });
            } else {
                // Add new grant
                this.ngoService.create_GrantApplication(grantData).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Grant application added successfully'
                        });
                        this.displayDialog = false;
                        this.loadApplications();
                    },
                    error: (error) => {
                        console.error('Failed to create grant application:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to create grant application'
                        });
                    }
                });
            }
        }
    }

    deleteGrant(app: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${app.projectName}"?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.ngoService.delete_GrantApplication(Number(app.id)).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Grant application deleted successfully'
                        });
                        this.loadApplications();
                    },
                    error: (error) => {
                        console.error('Failed to delete grant application:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete grant application'
                        });
                    }
                });
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    formatStatus(status: string): string {
        return status?.replace('-', ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'Unknown';
    }

    getStatusBadgeClass(status: string): string {
        switch (status?.toLowerCase()) {
            case 'submitted':
                return 'info';
            case 'under-review':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'completed':
                return 'secondary';
            default:
                return 'info';
        }
    }
}
