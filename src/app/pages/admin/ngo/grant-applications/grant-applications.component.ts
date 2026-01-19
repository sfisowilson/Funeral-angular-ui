import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgoServiceProxy, GrantApplication } from '../../../../core/services/service-proxies';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-grant-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [NgoServiceProxy],
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
  sortBy: string = 'date'; // date, status, amount
  filterStatus: string = ''; // filter by status
  
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
    { label: 'Arts & Culture', value: 'Arts & Culture' },
    { label: 'Sports', value: 'Sports' },
    { label: 'Religious', value: 'Religious' },
    { label: 'Technology', value: 'Technology' },
    { label: 'Social Welfare', value: 'Social Welfare' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.applicationForm = this.fb.group({
      organizationName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)]],
      projectName: ['', Validators.required],
      projectDescription: ['', [Validators.required, Validators.minLength(10)]],
      requestedAmount: [0, [Validators.required, Validators.min(1)]],
      projectCategory: ['', Validators.required],
      timeline: ['', Validators.required],
      beneficiaries: [0, [Validators.required, Validators.min(1)]],
      location: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: ['', Validators.required],
      documents: [''],
      status: ['Submitted'],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadGrantApplications();
  }

  loadGrantApplications(): void {
    this.loading = true;
    this.ngoService.get_GrantApplications().subscribe({
      next: (response: any) => {
        this.grantApplications = response?.result || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load grant applications:', error);
        this.grantApplications = [];
        this.loading = false;
      }
    });
  }

  openNewDialog(): void {
    this.selectedApplication = {
      submittedDate: new Date(),
      status: 'Submitted'
    };
    this.isEdit = false;
    this.displayDialog = true;
    this.applicationForm.reset({ status: 'Submitted' });
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
      this.ngoService.update_GrantApplication(this.selectedApplication.id, formData).subscribe({
        next: () => {
          alert('Grant application updated successfully');
          this.loadGrantApplications();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to update grant application:', error);
          alert('Failed to update grant application');
          this.loading = false;
        }
      });
    } else {
      this.ngoService.create_GrantApplication(formData).subscribe({
        next: () => {
          alert('Grant application created successfully');
          this.loadGrantApplications();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to create grant application:', error);
          alert('Failed to create grant application');
          this.loading = false;
        }
      });
    }
  }

  deleteApplication(application: any): void {
    if (confirm(`Are you sure you want to delete the grant application "${application.projectName}"?`)) {
      this.ngoService.delete_GrantApplication(application.id).subscribe({
        next: () => {
          alert('Grant application deleted successfully');
          this.loadGrantApplications();
        },
        error: (error) => {
          console.error('Failed to delete grant application:', error);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  }

  getTotalRequested(): number {
    return this.grantApplications.reduce((sum, app) => sum + (app.requestedAmount || 0), 0);
  }

  getCountByStatus(status: string): number {
    return this.grantApplications.filter(app => app.status === status).length;
  }

  getFilteredApplications(): any[] {
    let filtered = this.grantApplications;
    
    if (this.filterStatus) {
      filtered = filtered.filter(app => app.status === this.filterStatus);
    }
    
    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'amount':
          return (b.requestedAmount || 0) - (a.requestedAmount || 0);
        case 'date':
        default:
          return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      }
    });
  }
}
