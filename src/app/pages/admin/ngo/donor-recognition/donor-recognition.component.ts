import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgoServiceProxy, DonorRecognition } from '../../../../core/services/service-proxies';

@Component({
  selector: 'app-donor-recognition',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './donor-recognition.component.html',
  styleUrl: './donor-recognition.component.scss'
})
export class DonorRecognitionComponent implements OnInit {
  donorRecognitions: any[] = [];
  loading: boolean = false;
  selectedDonor: any = null;
  displayDialog: boolean = false;
  isEdit: boolean = false;
  donorForm: FormGroup;
  
  donorTypeOptions = [
    { label: 'Individual', value: 'Individual' },
    { label: 'Corporate', value: 'Corporate' },
    { label: 'Foundation', value: 'Foundation' },
    { label: 'Government', value: 'Government' },
    { label: 'NGO', value: 'NGO' }
  ];

  recognitionLevelOptions = [
    { label: 'Bronze', value: 'Bronze' },
    { label: 'Silver', value: 'Silver' },
    { label: 'Gold', value: 'Gold' },
    { label: 'Platinum', value: 'Platinum' },
    { label: 'Diamond', value: 'Diamond' }
  ];

  constructor(
    private fb: FormBuilder,
    private ngoService: NgoServiceProxy
  ) {
    this.donorForm = this.fb.group({
      donorName: ['', Validators.required],
      donorType: ['', Validators.required],
      donationAmount: [0, Validators.required, Validators.min(1)],
      donationDate: [new Date(), Validators.required],
      campaign: [''],
      recognitionLevel: ['', Validators.required],
      isAnonymous: [false],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDonorRecognitions();
  }

  loadDonorRecognitions(): void {
    this.loading = true;
    this.ngoService.getDonorRecognitions().subscribe({
      next: (data: any) => {
        this.donorRecognitions = data || [];
        this.loading = false;
      },
      error: (error) => {
        alert('Failed to load donor recognitions');
        this.loading = false;
      }
    });
  }

  openNewDialog(): void {
    this.selectedDonor = {};
    this.selectedDonor.donationDate = new Date();
    this.isEdit = false;
    this.displayDialog = true;
    this.donorForm.reset();
  }

  openEditDialog(donor: any): void {
    this.selectedDonor = { ...donor };
    this.isEdit = true;
    this.displayDialog = true;
    this.donorForm.patchValue(this.selectedDonor);
  }

  saveDonor(): void {
    if (this.donorForm.invalid) {
      alert('Please fill in all required fields');
      return;
    }

    this.loading = true;
    const formData = this.donorForm.value as DonorRecognition;
    
    if (this.isEdit && this.selectedDonor.id) {
      this.ngoService.updateDonorRecognition(this.selectedDonor.id, formData).subscribe({
        next: () => {
          alert('Donor recognition updated successfully');
          this.loadDonorRecognitions();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to update donor recognition');
          this.loading = false;
        }
      });
    } else {
      this.ngoService.createDonorRecognition(formData).subscribe({
        next: () => {
          alert('Donor recognition created successfully');
          this.loadDonorRecognitions();
          this.closeDialog();
          this.loading = false;
        },
        error: (error) => {
          alert('Failed to create donor recognition');
          this.loading = false;
        }
      });
    }
  }

  deleteDonor(donor: any): void {
    if (confirm(`Are you sure you want to delete the donor recognition for "${donor.donorName}"?`)) {
      this.ngoService.deleteDonorRecognition(donor.id).subscribe({
        next: () => {
          alert('Donor recognition deleted successfully');
          this.loadDonorRecognitions();
        },
        error: (error) => {
          alert('Failed to delete donor recognition');
        }
      });
    }
  }

  closeDialog(): void {
    this.displayDialog = false;
    this.selectedDonor = null;
    this.donorForm.reset();
  }

  viewDonor(donor: any): void {
    // Open donor details or navigate to detail page
  }

  getRecognitionLevelColor(level: string): string {
    switch (level) {
      case 'Bronze':
        return '#cd7f32';
      case 'Silver':
        return '#6c757d';
      case 'Gold':
        return '#f39c12';
      case 'Platinum':
        return '#6f42c1';
      case 'Diamond':
        return '#8b5cf6';
      default:
        return '#6c757d';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  }
}
