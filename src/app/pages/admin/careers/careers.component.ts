import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Career, CareerService, CareerStats } from '../../../core/services/career.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './careers.component.html',
  styleUrls: ['./careers.component.scss']
})
export class CareersComponent implements OnInit {
  careers: Career[] = [];
  filteredCareers: Career[] = [];
  displayDialog: boolean = false;
  careerForm!: FormGroup;
  selectedCareer: Career | null = null;
  loading: boolean = false;
  isEditMode: boolean = false;
  stats: CareerStats | null = null;

  // Filter properties
  searchTerm: string = '';
  filterDepartment: string = '';
  filterEmploymentType: string = '';
  filterStatus: string = 'all';

  employmentTypes = [
    { label: 'Full-Time', value: 'Full-Time' },
    { label: 'Part-Time', value: 'Part-Time' },
    { label: 'Contract', value: 'Contract' },
    { label: 'Internship', value: 'Internship' }
  ];

  departments: string[] = [];

  // For dynamic lists in form
  responsibilities: string[] = [];
  requirements: string[] = [];
  benefits: string[] = [];

  // Expose Object for template
  Object = Object;

  constructor(
    private fb: FormBuilder,
    private careerService: CareerService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCareers();
    this.loadStats();
  }

  initForm(): void {
    this.careerForm = this.fb.group({
      id: [''],
      jobTitle: ['', [Validators.required, Validators.maxLength(200)]],
      department: ['', [Validators.required, Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      employmentType: ['Full-Time', Validators.required],
      salaryRange: ['', Validators.maxLength(100)],
      description: ['', [Validators.required, Validators.minLength(50)]],
      applicationDeadline: ['', Validators.required],
      isActive: [true]
    });
  }

  loadCareers(): void {
    this.loading = true;
    this.careerService.getCareers().subscribe({
      next: (data: Career[]) => {
        this.careers = data || [];
        this.filteredCareers = [...this.careers];
        this.extractDepartments();
        this.applyFilters();
        this.loading = false;
      },
      error: (_error: any) => {
        alert('Failed to load careers');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.careerService.getCareerStats().subscribe({
      next: (stats: CareerStats) => {
        this.stats = stats;
      },
      error: (_error: any) => {
        console.error('Failed to load stats', _error);
      }
    });
  }

  extractDepartments(): void {
    const deptSet = new Set(this.careers.map(c => c.department));
    this.departments = Array.from(deptSet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.careers];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.jobTitle.toLowerCase().includes(search) ||
        c.department.toLowerCase().includes(search) ||
        c.location.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
      );
    }

    // Department filter
    if (this.filterDepartment) {
      filtered = filtered.filter(c => c.department === this.filterDepartment);
    }

    // Employment type filter
    if (this.filterEmploymentType) {
      filtered = filtered.filter(c => c.employmentType === this.filterEmploymentType);
    }

    // Status filter
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    this.filteredCareers = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterDepartment = '';
    this.filterEmploymentType = '';
    this.filterStatus = 'all';
    this.applyFilters();
  }

  showAddDialog(): void {
    this.isEditMode = false;
    this.selectedCareer = null;
    this.careerForm.reset({
      id: '',
      jobTitle: '',
      department: '',
      location: '',
      employmentType: 'Full-Time',
      salaryRange: '',
      description: '',
      applicationDeadline: '',
      isActive: true
    });
    // Mark form as pristine and untouched so validation doesn't show immediately
    this.careerForm.markAsPristine();
    this.careerForm.markAsUntouched();
    this.responsibilities = [];
    this.requirements = [];
    this.benefits = [];
    this.displayDialog = true;
  }

  editCareer(career: Career): void {
    this.isEditMode = true;
    this.selectedCareer = career;
    
    // Convert Date objects for form
    const deadlineDate = career.applicationDeadline instanceof Date 
      ? career.applicationDeadline.toISOString().split('T')[0]
      : new Date(career.applicationDeadline).toISOString().split('T')[0];

    this.careerForm.patchValue({
      id: career.id,
      jobTitle: career.jobTitle,
      department: career.department,
      location: career.location,
      employmentType: career.employmentType,
      salaryRange: career.salaryRange || '',
      description: career.description,
      applicationDeadline: deadlineDate,
      isActive: career.isActive
    });

    this.responsibilities = [...(career.responsibilities || [])];
    this.requirements = [...(career.requirements || [])];
    this.benefits = [...(career.benefitsHighlights || [])];

    this.displayDialog = true;
  }

  saveCareer(): void {
    if (this.careerForm.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    
    const formValue = this.careerForm.value;
    const careerData: Career = {
      ...formValue,
      responsibilities: this.responsibilities,
      requirements: this.requirements,
      benefitsHighlights: this.benefits,
      applicationDeadline: new Date(formValue.applicationDeadline)
    };

    const operation = this.isEditMode
      ? this.careerService.updateCareer(careerData.id, careerData)
      : this.careerService.createCareer(careerData);

    operation.subscribe({
      next: () => {
        alert(`Career ${this.isEditMode ? 'updated' : 'created'} successfully`);
        this.displayDialog = false;
        this.loadCareers();
        this.loadStats();
        this.loading = false;
      },
      error: (_error: any) => {
        alert(`Failed to ${this.isEditMode ? 'update' : 'create'} career`);
        this.loading = false;
      }
    });
  }

  deleteCareer(career: Career): void {
    if (!confirm(`Are you sure you want to delete "${career.jobTitle}"?`)) {
      return;
    }

    this.loading = true;
    this.careerService.deleteCareer(career.id).subscribe({
      next: () => {
        alert('Career deleted successfully');
        this.loadCareers();
        this.loadStats();
        this.loading = false;
      },
      error: (_error: any) => {
        alert('Failed to delete career');
        this.loading = false;
      }
    });
  }

  toggleCareerStatus(career: Career): void {
    this.loading = true;
    this.careerService.toggleCareerStatus(career.id, !career.isActive).subscribe({
      next: () => {
        career.isActive = !career.isActive;
        this.loading = false;
      },
      error: (_error: any) => {
        alert('Failed to update career status');
        this.loading = false;
      }
    });
  }

  cancelDialog(): void {
    this.displayDialog = false;
    this.careerForm.reset();
  }

  // Dynamic list management
  addResponsibility(): void {
    const value = prompt('Enter responsibility:');
    if (value && value.trim()) {
      this.responsibilities.push(value.trim());
    }
  }

  removeResponsibility(index: number): void {
    this.responsibilities.splice(index, 1);
  }

  addRequirement(): void {
    const value = prompt('Enter requirement:');
    if (value && value.trim()) {
      this.requirements.push(value.trim());
    }
  }

  removeRequirement(index: number): void {
    this.requirements.splice(index, 1);
  }

  addBenefit(): void {
    const value = prompt('Enter benefit:');
    if (value && value.trim()) {
      this.benefits.push(value.trim());
    }
  }

  removeBenefit(index: number): void {
    this.benefits.splice(index, 1);
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  getEmploymentTypeBadgeClass(type: string): string {
    const badges: any = {
      'Full-Time': 'badge bg-primary',
      'Part-Time': 'badge bg-info',
      'Contract': 'badge bg-warning',
      'Internship': 'badge bg-secondary'
    };
    return badges[type] || 'badge bg-secondary';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
