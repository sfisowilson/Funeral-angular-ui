import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgoServiceProxy, ImpactReport } from '../../../../core/services/service-proxies';

@Component({
  selector: 'app-impact-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './impact-reports.component.html',
  styleUrl: './impact-reports.component.scss'
})
export class ImpactReportsComponent implements OnInit {
  impactReports: any[] = [];
  loading: boolean = false;
  selectedReport: any = null;
  displayDialog: boolean = false;
  isEdit: boolean = false;
  reportForm: FormGroup;
  
  categoryOptions = [
    { label: 'Education', value: 'Education' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Community Development', value: 'Community Development' },
    { label: 'Environmental', value: 'Environmental' },
    { label: 'Human Rights', value: 'Human Rights' },
    { label: 'Arts & Culture', value: 'Arts & Culture' }
  ];

  periodOptions = [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Bi-Annual', value: 'Bi-Annual' },
    { label: 'Annual', value: 'Annual' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.reportForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      reportDate: [new Date(), Validators.required],
      period: ['', Validators.required],
      isPublished: [false],
      attachments: [''],
      metrics: this.fb.group({
        beneficiariesReached: [0, Validators.required, Validators.min(0)],
        fundsUtilized: [0, Validators.required, Validators.min(0)],
        projectsCompleted: [0, Validators.required, Validators.min(0)],
        volunteerHours: [0, Validators.required, Validators.min(0)]
      })
    });
  }

  ngOnInit(): void {
    this.loadImpactReports();
  }

  loadImpactReports(): void {
    this.loading = true;
    this.ngoService.getImpactReports().subscribe({
      next: (data: any) => {
        this.impactReports = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load impact reports');
        this.loading = false;
      }
    });
  }

  openNewDialog(): void {
    this.selectedReport = {};
    this.selectedReport.reportDate = new Date();
    this.isEdit = false;
    this.displayDialog = true;
    this.reportForm.reset();
  }

  openEditDialog(report: any): void {
    this.selectedReport = { ...report };
    this.isEdit = true;
    this.displayDialog = true;
    this.reportForm.patchValue(this.selectedReport);
  }

  saveReport(): void {
    if (this.reportForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.loading = true;
    const formData = this.reportForm.value;
    const report: ImpactReport = {
      ...formData,
      metrics: typeof formData.metrics === 'string' ? formData.metrics : JSON.stringify(formData.metrics)
    };
    
    if (this.isEdit && this.selectedReport.id) {
      this.ngoService.updateImpactReport(this.selectedReport.id, report).subscribe({
        next: () => {
          alert('Impact report updated successfully');
          this.loadImpactReports();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to update impact report');
          this.loading = false;
        }
      });
    } else {
      this.ngoService.createImpactReport(report).subscribe({
        next: () => {
          alert('Impact report created successfully');
          this.loadImpactReports();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to create impact report');
          this.loading = false;
        }
      });
    }
  }

  deleteReport(report: any): void {
    if (confirm(`Are you sure you want to delete the impact report "${report.title}"?`)) {
      this.ngoService.deleteImpactReport(report.id).subscribe({
        next: () => {
          alert('Impact report deleted successfully');
          this.loadImpactReports();
        },
        error: (error) => {
          alert('Failed to delete impact report');
        }
      });
    }
  }

  togglePublishStatus(report: any): void {
    const updatedReport = { ...report, isPublished: !report.isPublished };
    this.ngoService.updateImpactReport(report.id, updatedReport).subscribe({
      next: () => {
        alert(`Impact report ${!report.isPublished ? 'published' : 'unpublished'} successfully`);
        this.loadImpactReports();
      },
      error: (error) => {
        alert('Failed to update report status');
      }
    });
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.selectedReport = null;
    this.reportForm.reset();
  }

  viewReport(report: any): void {
    // Open report details or navigate to detail page
  }

  getPublishSeverity(isPublished: boolean): string {
    return isPublished ? 'success' : 'warning';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }

  downloadAttachment(attachment: string): void {
    // TODO: Implement actual download functionality
    alert(`Downloading ${attachment}...`);
  }
}
