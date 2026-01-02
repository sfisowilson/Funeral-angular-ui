import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Career, CareerService } from '../../core/services/career.service';

@Component({
    selector: 'app-careers-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="careers-widget" 
            [style.background-color]="config.backgroundColor" 
            [style.padding.px]="config.padding || 60">
            <div class="container mx-auto" [style.max-width.px]="config.containerWidth || 1200">
                <!-- Header Section -->
                <div class="text-center mb-5">
                    <h2 class="widget-title" 
                        [style.color]="config.titleColor" 
                        [style.font-size.px]="config.titleSize || 42"
                        [style.font-weight]="config.titleFontWeight || 700">
                        {{ config.title || 'Join Our Team' }}
                    </h2>
                    <p *ngIf="config.subtitle" 
                        class="widget-subtitle mt-3" 
                        [style.color]="config.subtitleColor" 
                        [style.font-size.px]="config.subtitleSize || 18"
                        [style.max-width.px]="config.subtitleMaxWidth || 800"
                        style="margin-left: auto; margin-right: auto;">
                        {{ config.subtitle }}
                    </p>
                </div>

                <!-- Loading State -->
                <div *ngIf="loading" class="text-center py-5">
                    <div class="spinner" [style.border-color]="config.primaryColor || '#0d6efd'"></div>
                    <p class="mt-3" [style.color]="config.textColor || '#6c757d'">Loading opportunities...</p>
                </div>

                <!-- Empty State -->
                <div *ngIf="!loading && careers.length === 0" class="text-center py-5">
                    <div class="empty-icon" [style.color]="config.emptyStateColor || '#dee2e6'">
                        <i class="bi bi-briefcase" style="font-size: 4rem;"></i>
                    </div>
                    <p class="mt-3" [style.color]="config.textColor || '#6c757d'">
                        {{ config.emptyStateText || 'No open positions at the moment. Check back soon!' }}
                    </p>
                </div>

                <!-- Filter Section (if enabled) -->
                <div *ngIf="!loading && careers.length > 0 && config.showFilters" 
                    class="filters-section mb-4">
                    <div class="row g-3">
                        <div class="col-md-4" *ngIf="config.showDepartmentFilter">
                            <select class="filter-select" 
                                [(ngModel)]="selectedDepartment" 
                                (change)="applyFilters()"
                                [style.border-color]="config.primaryColor || '#0d6efd'">
                                <option value="">All Departments</option>
                                <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                            </select>
                        </div>
                        <div class="col-md-4" *ngIf="config.showTypeFilter">
                            <select class="filter-select" 
                                [(ngModel)]="selectedType" 
                                (change)="applyFilters()"
                                [style.border-color]="config.primaryColor || '#0d6efd'">
                                <option value="">All Types</option>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>
                        <div class="col-md-4" *ngIf="config.showLocationFilter">
                            <select class="filter-select" 
                                [(ngModel)]="selectedLocation" 
                                (change)="applyFilters()"
                                [style.border-color]="config.primaryColor || '#0d6efd'">
                                <option value="">All Locations</option>
                                <option *ngFor="let loc of locations" [value]="loc">{{ loc }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Careers List -->
                <div *ngIf="!loading && filteredCareers.length > 0" 
                    [ngClass]="config.layout === 'grid' ? 'careers-grid' : 'careers-list'">
                    <div *ngFor="let career of filteredCareers" 
                        class="career-card" 
                        [style.background-color]="config.cardBackgroundColor || '#ffffff'"
                        [style.border-color]="config.cardBorderColor || '#e0e0e0'"
                        (click)="openCareerDetail(career)">
                        
                        <!-- Card Header -->
                        <div class="career-header">
                            <div class="career-title-section">
                                <h3 class="career-title" 
                                    [style.color]="config.cardTitleColor || '#212529'"
                                    [style.font-size.px]="config.cardTitleSize || 22">
                                    {{ career.jobTitle }}
                                </h3>
                                <div class="career-meta">
                                    <span class="meta-item" [style.color]="config.metaColor || '#6c757d'">
                                        <i class="bi bi-building me-1"></i>
                                        {{ career.department }}
                                    </span>
                                    <span class="meta-item" [style.color]="config.metaColor || '#6c757d'">
                                        <i class="bi bi-geo-alt me-1"></i>
                                        {{ career.location }}
                                    </span>
                                </div>
                            </div>
                            <div class="career-badges">
                                <span class="employment-badge" 
                                    [style.background-color]="getEmploymentTypeColor(career.employmentType)"
                                    [style.color]="config.badgeTextColor || '#ffffff'">
                                    {{ career.employmentType }}
                                </span>
                            </div>
                        </div>

                        <!-- Card Body -->
                        <div class="career-body">
                            <p class="career-description" 
                                [style.color]="config.descriptionColor || '#495057'"
                                [style.font-size.px]="config.descriptionSize || 15">
                                {{ career.description | slice:0:config.descriptionLength || 200 }}{{ career.description.length > (config.descriptionLength || 200) ? '...' : '' }}
                            </p>

                            <div *ngIf="config.showSalary && career.salaryRange" class="salary-range">
                                <i class="bi bi-cash-stack me-2"></i>
                                <span [style.color]="config.salaryColor || '#28a745'">
                                    {{ career.salaryRange }}
                                </span>
                            </div>

                            <div *ngIf="config.showDeadline" class="deadline">
                                <i class="bi bi-calendar-event me-2"></i>
                                <span [style.color]="config.deadlineColor || '#6c757d'">
                                    Apply by {{ formatDate(career.applicationDeadline) }}
                                </span>
                            </div>
                        </div>

                        <!-- Card Footer -->
                        <div class="career-footer">
                            <button class="apply-button" 
                                [style.background-color]="config.buttonColor || '#0d6efd'"
                                [style.color]="config.buttonTextColor || '#ffffff'"
                                (click)="applyForCareer(career, $event)">
                                {{ config.applyButtonText || 'Apply Now' }}
                                <i class="bi bi-arrow-right ms-2"></i>
                            </button>
                            <button *ngIf="config.showViewDetailsButton" 
                                class="details-button" 
                                [style.color]="config.detailsButtonColor || '#0d6efd'"
                                (click)="viewDetails(career, $event)">
                                {{ config.viewDetailsText || 'View Details' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- No Results After Filter -->
                <div *ngIf="!loading && careers.length > 0 && filteredCareers.length === 0" 
                    class="text-center py-5">
                    <p [style.color]="config.textColor || '#6c757d'">
                        No positions match your filter criteria.
                    </p>
                </div>
            </div>
        </div>

        <!-- Career Detail Modal (if enabled) -->
        <div *ngIf="config.showDetailModal && selectedCareer" 
            class="career-modal-overlay" 
            (click)="closeModal()">
            <div class="career-modal" (click)="$event.stopPropagation()"
                [style.background-color]="config.modalBackgroundColor || '#ffffff'">
                <button class="modal-close" (click)="closeModal()"
                    [style.color]="config.closeButtonColor || '#000000'">
                    <i class="bi bi-x-lg"></i>
                </button>

                <div class="modal-content">
                    <div class="modal-header">
                        <h2 [style.color]="config.modalTitleColor || '#212529'">
                            {{ selectedCareer.jobTitle }}
                        </h2>
                        <div class="modal-meta">
                            <span><i class="bi bi-building me-1"></i>{{ selectedCareer.department }}</span>
                            <span><i class="bi bi-geo-alt me-1"></i>{{ selectedCareer.location }}</span>
                            <span class="employment-badge" 
                                [style.background-color]="getEmploymentTypeColor(selectedCareer.employmentType)">
                                {{ selectedCareer.employmentType }}
                            </span>
                        </div>
                    </div>

                    <div class="modal-body">
                        <section class="modal-section">
                            <h3 [style.color]="config.sectionTitleColor || '#495057'">Description</h3>
                            <p [style.color]="config.descriptionColor || '#6c757d'">{{ selectedCareer.description }}</p>
                        </section>

                        <section class="modal-section" *ngIf="selectedCareer.responsibilities && selectedCareer.responsibilities.length > 0">
                            <h3 [style.color]="config.sectionTitleColor || '#495057'">Key Responsibilities</h3>
                            <ul>
                                <li *ngFor="let item of selectedCareer.responsibilities" 
                                    [style.color]="config.descriptionColor || '#6c757d'">
                                    {{ item }}
                                </li>
                            </ul>
                        </section>

                        <section class="modal-section" *ngIf="selectedCareer.requirements && selectedCareer.requirements.length > 0">
                            <h3 [style.color]="config.sectionTitleColor || '#495057'">Requirements</h3>
                            <ul>
                                <li *ngFor="let item of selectedCareer.requirements" 
                                    [style.color]="config.descriptionColor || '#6c757d'">
                                    {{ item }}
                                </li>
                            </ul>
                        </section>

                        <section class="modal-section" *ngIf="selectedCareer.benefitsHighlights && selectedCareer.benefitsHighlights.length > 0">
                            <h3 [style.color]="config.sectionTitleColor || '#495057'">Benefits & Perks</h3>
                            <ul>
                                <li *ngFor="let item of selectedCareer.benefitsHighlights" 
                                    [style.color]="config.descriptionColor || '#6c757d'">
                                    {{ item }}
                                </li>
                            </ul>
                        </section>

                        <section class="modal-section">
                            <div class="modal-footer-info">
                                <div *ngIf="selectedCareer.salaryRange">
                                    <strong>Salary Range:</strong> {{ selectedCareer.salaryRange }}
                                </div>
                                <div>
                                    <strong>Application Deadline:</strong> {{ formatDate(selectedCareer.applicationDeadline) }}
                                </div>
                            </div>
                        </section>
                    </div>

                    <div class="modal-footer-action">
                        <button class="apply-button-large" 
                            [style.background-color]="config.buttonColor || '#0d6efd'"
                            [style.color]="config.buttonTextColor || '#ffffff'"
                            (click)="applyForCareer(selectedCareer, $event)">
                            {{ config.applyButtonText || 'Apply Now' }}
                            <i class="bi bi-arrow-right ms-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .careers-widget {
            position: relative;
        }

        .widget-title {
            margin: 0;
            line-height: 1.2;
        }

        .widget-subtitle {
            line-height: 1.6;
            margin: 0 auto;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .filters-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .filter-select {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s;
            background: white;
        }

        .filter-select:focus {
            outline: none;
            border-color: currentColor;
            box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
        }

        .careers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
        }

        .careers-list {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .career-card {
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .career-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            border-color: #0d6efd;
        }

        .career-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            gap: 1rem;
        }

        .career-title-section {
            flex: 1;
        }

        .career-title {
            margin: 0 0 0.5rem 0;
            line-height: 1.3;
        }

        .career-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 14px;
        }

        .meta-item {
            display: flex;
            align-items: center;
        }

        .career-badges {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .employment-badge {
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
        }

        .career-body {
            margin-bottom: 1rem;
        }

        .career-description {
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .salary-range, .deadline {
            font-size: 14px;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
        }

        .career-footer {
            display: flex;
            gap: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e0e0e0;
        }

        .apply-button, .apply-button-large {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .apply-button-large {
            width: 100%;
            padding: 1rem 2rem;
            font-size: 16px;
        }

        .apply-button:hover, .apply-button-large:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .details-button {
            padding: 0.75rem 1.5rem;
            border: 2px solid currentColor;
            background: transparent;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .details-button:hover {
            background: currentColor;
            color: white !important;
        }

        /* Modal Styles */
        .career-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 2rem;
        }

        .career-modal {
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 16px;
            position: relative;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s;
        }

        .modal-close:hover {
            background: rgba(0, 0, 0, 0.1);
        }

        .modal-content {
            padding: 2rem;
        }

        .modal-header {
            margin-bottom: 2rem;
        }

        .modal-header h2 {
            margin: 0 0 1rem 0;
        }

        .modal-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 14px;
            color: #6c757d;
        }

        .modal-body {
            margin-bottom: 2rem;
        }

        .modal-section {
            margin-bottom: 2rem;
        }

        .modal-section h3 {
            font-size: 18px;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        .modal-section ul {
            list-style-position: inside;
            padding-left: 0;
        }

        .modal-section li {
            margin-bottom: 0.5rem;
            line-height: 1.6;
        }

        .modal-footer-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .modal-footer-action {
            position: sticky;
            bottom: 0;
            background: white;
            padding-top: 1rem;
            border-top: 1px solid #e0e0e0;
        }

        @media (max-width: 768px) {
            .careers-grid {
                grid-template-columns: 1fr;
            }

            .career-header {
                flex-direction: column;
            }

            .career-footer {
                flex-direction: column;
            }

            .career-modal-overlay {
                padding: 1rem;
            }

            .modal-content {
                padding: 1.5rem;
            }
        }
    `]
})
export class CareersWidgetComponent implements OnInit {
    @Input() config: any = {};

    careers: Career[] = [];
    filteredCareers: Career[] = [];
    loading: boolean = true;
    departments: string[] = [];
    locations: string[] = [];
    
    selectedDepartment: string = '';
    selectedType: string = '';
    selectedLocation: string = '';
    selectedCareer: Career | null = null;

    constructor(private careerService: CareerService) {}

    ngOnInit(): void {
        this.loadCareers();
    }

    loadCareers(): void {
        this.loading = true;
        this.careerService.getActiveCareers().subscribe({
            next: (data: Career[]) => {
                this.careers = data;
                this.filteredCareers = [...this.careers];
                this.extractFilterOptions();
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load careers', error);
                this.careers = [];
                this.filteredCareers = [];
                this.loading = false;
            }
        });
    }

    extractFilterOptions(): void {
        this.departments = [...new Set(this.careers.map(c => c.department))].sort();
        this.locations = [...new Set(this.careers.map(c => c.location))].sort();
    }

    applyFilters(): void {
        let filtered = [...this.careers];

        if (this.selectedDepartment) {
            filtered = filtered.filter(c => c.department === this.selectedDepartment);
        }

        if (this.selectedType) {
            filtered = filtered.filter(c => c.employmentType === this.selectedType);
        }

        if (this.selectedLocation) {
            filtered = filtered.filter(c => c.location === this.selectedLocation);
        }

        this.filteredCareers = filtered;
    }

    getEmploymentTypeColor(type: string): string {
        const colors: any = {
            'Full-Time': this.config.fullTimeColor || '#0d6efd',
            'Part-Time': this.config.partTimeColor || '#17a2b8',
            'Contract': this.config.contractColor || '#ffc107',
            'Internship': this.config.internshipColor || '#6c757d'
        };
        return colors[type] || '#6c757d';
    }

    formatDate(date: Date | string | undefined): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    openCareerDetail(career: Career): void {
        if (this.config.showDetailModal) {
            this.selectedCareer = career;
        }
    }

    closeModal(): void {
        this.selectedCareer = null;
    }

    viewDetails(career: Career, event: Event): void {
        event.stopPropagation();
        this.selectedCareer = career;
    }

    applyForCareer(career: Career, event: Event): void {
        event.stopPropagation();
        
        if (this.config.applicationUrl) {
            // Custom application URL
            const url = this.config.applicationUrl.replace('{careerId}', career.id);
            window.open(url, '_blank');
        } else if (this.config.applicationEmail) {
            // Email application
            const subject = encodeURIComponent(`Application for ${career.jobTitle}`);
            const body = encodeURIComponent(`I would like to apply for the ${career.jobTitle} position.`);
            window.location.href = `mailto:${this.config.applicationEmail}?subject=${subject}&body=${body}`;
        } else {
            // Default: Show alert
            alert(`To apply for ${career.jobTitle}, please contact us directly or visit our careers page.`);
        }
    }
}
