import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgoServiceProxy, GrantApplication } from '../../../../core/services/service-proxies';

@Component({
  selector: 'app-grant-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './grant-applications.component.html',
  styleUrl: './grant-applications.component.scss'
})
export class GrantApplicationsComponent implements OnInit {
  grantApplications: any[] = [];
  loading: boolean = false;
  selectedApplication: any = null;
  displayDialog: boolean = false;
  isEdit: boolean = false;
  applicationForm: FormGroup;
  
  statusOptions = [
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Under Review', value: 'Under Review' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  categoryOptions = [
    { label: 'Education', value: 'Education' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Community Development', value: 'Community Development' },
    { label: 'Environmental', value: 'Environmental' },
    { label: 'Human Rights', value: 'Human Rights' },
    { label: 'Arts & Culture', value: 'Arts & Culture' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.applicationForm = this.fb.group({
      organizationName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      projectName: ['', Validators.required],
      projectDescription: ['', Validators.required],
      requestedAmount: [0, Validators.required, Validators.min(1)],
      projectCategory: ['', Validators.required],
      timeline: ['', Validators.required],
      status: ['Submitted'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadGrantApplications();
  }

  loadGrantApplications(): void {
    this.loading = true;
    this.ngoService.getGrantApplications().subscribe({
      next: (data: any) => {
        this.grantApplications = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load grant applications');
        this.loading = false;
      }
    });
  }

  openNewDialog(): void {
    this.selectedApplication = {};
    this.selectedApplication.submittedDate = new Date();
    this.isEdit = false;
    this.displayDialog = true;
    this.applicationForm.reset();
  }

  openEditDialog(application: any): void {
    this.selectedApplication = { ...application };
    this.isEdit = true;
    this.displayDialog = true;
    this.applicationForm.patchValue(this.selectedApplication);
  }

  saveApplication(): void {
    if (this.applicationForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.loading = true;
    const formData = this.applicationForm.value as GrantApplication;
    
    if (this.isEdit && this.selectedApplication.id) {
      this.ngoService.updateGrantApplication(this.selectedApplication.id, formData).subscribe({
        next: () => {
          alert('Grant application updated successfully');
          this.loadGrantApplications();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to update grant application');
          this.loading = false;
        }
      });
    } else {
      this.ngoService.createGrantApplication(formData).subscribe({
        next: () => {
          alert('Grant application created successfully');
          this.loadGrantApplications();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to create grant application');
          this.loading = false;
        }
      });
    }
  }

  deleteApplication(application: any): void {
    if (confirm(`Are you sure you want to delete the grant application "${application.projectName}"?`)) {
      this.ngoService.deleteGrantApplication(application.id).subscribe({
        next: () => {
          alert('Grant application deleted successfully');
          this.loadGrantApplications();
        },
        error: (error) => {
          alert('Failed to delete grant application');
        }
      });
    }
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.selectedApplication = null;
    this.applicationForm.reset();
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'Submitted':
        return 'info';
      case 'Under Review':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'info';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}
