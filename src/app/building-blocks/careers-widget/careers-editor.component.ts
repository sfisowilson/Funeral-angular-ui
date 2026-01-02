import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-careers-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="careers-editor p-4">
            <div class="alert alert-info mb-4">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Careers Widget:</strong> Display job openings from your organization. Manage positions from 
                <strong>Admin → NGO → Careers</strong>.
            </div>

            <!-- General Settings -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-gear me-2"></i>General Settings</h6>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Widget Title</label>
                        <input type="text" class="form-control" 
                            [(ngModel)]="config.title" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="Join Our Team" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Subtitle</label>
                        <textarea class="form-control" rows="2"
                            [(ngModel)]="config.subtitle" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="Discover exciting career opportunities..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Layout</label>
                        <select class="form-select" 
                            [(ngModel)]="config.layout" 
                            (ngModelChange)="onConfigChange()">
                            <option value="grid">Grid (Cards)</option>
                            <option value="list">List (Stacked)</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Empty State Text</label>
                        <input type="text" class="form-control" 
                            [(ngModel)]="config.emptyStateText" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="No open positions at the moment..." />
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-funnel me-2"></i>Filters & Sorting</h6>
                </div>
                <div class="card-body">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" 
                            [(ngModel)]="config.showFilters" 
                            (ngModelChange)="onConfigChange()"
                            id="showFilters" />
                        <label class="form-check-label" for="showFilters">
                            Show Filter Options
                        </label>
                    </div>
                    
                    <div *ngIf="config.showFilters" class="ms-4">
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" 
                                [(ngModel)]="config.showDepartmentFilter" 
                                (ngModelChange)="onConfigChange()"
                                id="showDeptFilter" />
                            <label class="form-check-label" for="showDeptFilter">
                                Department Filter
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" 
                                [(ngModel)]="config.showTypeFilter" 
                                (ngModelChange)="onConfigChange()"
                                id="showTypeFilter" />
                            <label class="form-check-label" for="showTypeFilter">
                                Employment Type Filter
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" 
                                [(ngModel)]="config.showLocationFilter" 
                                (ngModelChange)="onConfigChange()"
                                id="showLocFilter" />
                            <label class="form-check-label" for="showLocFilter">
                                Location Filter
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Display Options -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-eye me-2"></i>Display Options</h6>
                </div>
                <div class="card-body">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" 
                            [(ngModel)]="config.showSalary" 
                            (ngModelChange)="onConfigChange()"
                            id="showSalary" />
                        <label class="form-check-label" for="showSalary">
                            Show Salary Range
                        </label>
                    </div>
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" 
                            [(ngModel)]="config.showDeadline" 
                            (ngModelChange)="onConfigChange()"
                            id="showDeadline" />
                        <label class="form-check-label" for="showDeadline">
                            Show Application Deadline
                        </label>
                    </div>
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" 
                            [(ngModel)]="config.showDetailModal" 
                            (ngModelChange)="onConfigChange()"
                            id="showModal" />
                        <label class="form-check-label" for="showModal">
                            Open Details in Modal
                        </label>
                    </div>
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" 
                            [(ngModel)]="config.showViewDetailsButton" 
                            (ngModelChange)="onConfigChange()"
                            id="showViewBtn" />
                        <label class="form-check-label" for="showViewBtn">
                            Show "View Details" Button
                        </label>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description Length (characters)</label>
                        <input type="number" class="form-control" 
                            [(ngModel)]="config.descriptionLength" 
                            (ngModelChange)="onConfigChange()"
                            min="50" max="500" />
                    </div>
                </div>
            </div>

            <!-- Application Settings -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-send me-2"></i>Application Settings</h6>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label class="form-label">Apply Button Text</label>
                        <input type="text" class="form-control" 
                            [(ngModel)]="config.applyButtonText" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="Apply Now" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">View Details Text</label>
                        <input type="text" class="form-control" 
                            [(ngModel)]="config.viewDetailsText" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="View Details" />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Application Method</label>
                        <select class="form-select" 
                            [(ngModel)]="applicationMethod" 
                            (ngModelChange)="onApplicationMethodChange()">
                            <option value="alert">Show Alert (Default)</option>
                            <option value="email">Email Application</option>
                            <option value="url">Custom URL</option>
                        </select>
                    </div>
                    <div *ngIf="applicationMethod === 'email'" class="mb-3">
                        <label class="form-label">Application Email</label>
                        <input type="email" class="form-control" 
                            [(ngModel)]="config.applicationEmail" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="careers@company.com" />
                    </div>
                    <div *ngIf="applicationMethod === 'url'" class="mb-3">
                        <label class="form-label">Application URL</label>
                        <input type="text" class="form-control" 
                            [(ngModel)]="config.applicationUrl" 
                            (ngModelChange)="onConfigChange()"
                            placeholder="https://company.com/apply/{{'{careerId}'}}" />
                        <small class="form-text text-muted">Use {{'{careerId}'}} as placeholder for job ID</small>
                    </div>
                </div>
            </div>

            <!-- Styling -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-palette me-2"></i>Colors & Styling</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Background Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.backgroundColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Primary Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.primaryColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Title Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.titleColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Subtitle Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.subtitleColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Card Background</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.cardBackgroundColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Button Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.buttonColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Button Text Color</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.buttonTextColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                    </div>

                    <!-- Employment Type Colors -->
                    <hr class="my-3" />
                    <h6 class="mb-3">Employment Type Badge Colors</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Full-Time</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.fullTimeColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Part-Time</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.partTimeColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Contract</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.contractColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Internship</label>
                            <input type="color" class="form-control form-control-color w-100" 
                                [(ngModel)]="config.internshipColor" 
                                (ngModelChange)="onConfigChange()" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Typography -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-fonts me-2"></i>Typography</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Title Size (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.titleSize" 
                                (ngModelChange)="onConfigChange()"
                                min="20" max="60" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Subtitle Size (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.subtitleSize" 
                                (ngModelChange)="onConfigChange()"
                                min="12" max="30" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Card Title Size (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.cardTitleSize" 
                                (ngModelChange)="onConfigChange()"
                                min="14" max="32" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Description Size (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.descriptionSize" 
                                (ngModelChange)="onConfigChange()"
                                min="12" max="20" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Spacing -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-arrows-angle-expand me-2"></i>Spacing</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Widget Padding (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.padding" 
                                (ngModelChange)="onConfigChange()"
                                min="0" max="200" />
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Container Max Width (px)</label>
                            <input type="number" class="form-control" 
                                [(ngModel)]="config.containerWidth" 
                                (ngModelChange)="onConfigChange()"
                                min="800" max="1600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .careers-editor {
            max-height: 80vh;
            overflow-y: auto;

            .card {
                border: 1px solid #dee2e6;
                border-radius: 8px;
                
                .card-header {
                    border-bottom: 1px solid #dee2e6;
                    padding: 0.75rem 1rem;
                    
                    h6 {
                        font-weight: 600;
                        color: #495057;
                    }
                }
            }

            .form-label {
                font-weight: 500;
                color: #495057;
                margin-bottom: 0.5rem;
            }

            .form-check-label {
                font-weight: 400;
            }

            .alert {
                border-radius: 8px;
            }
        }
    `]
})
export class CareersEditorComponent {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    applicationMethod: string = 'alert';

    ngOnInit(): void {
        // Initialize defaults if not present
        this.config = {
            title: this.config.title || 'Join Our Team',
            subtitle: this.config.subtitle || 'Discover exciting career opportunities and grow with us',
            layout: this.config.layout || 'grid',
            showFilters: this.config.showFilters !== undefined ? this.config.showFilters : true,
            showDepartmentFilter: this.config.showDepartmentFilter !== undefined ? this.config.showDepartmentFilter : true,
            showTypeFilter: this.config.showTypeFilter !== undefined ? this.config.showTypeFilter : true,
            showLocationFilter: this.config.showLocationFilter !== undefined ? this.config.showLocationFilter : true,
            showSalary: this.config.showSalary !== undefined ? this.config.showSalary : true,
            showDeadline: this.config.showDeadline !== undefined ? this.config.showDeadline : true,
            showDetailModal: this.config.showDetailModal !== undefined ? this.config.showDetailModal : true,
            showViewDetailsButton: this.config.showViewDetailsButton !== undefined ? this.config.showViewDetailsButton : true,
            descriptionLength: this.config.descriptionLength || 200,
            applyButtonText: this.config.applyButtonText || 'Apply Now',
            viewDetailsText: this.config.viewDetailsText || 'View Details',
            emptyStateText: this.config.emptyStateText || 'No open positions at the moment. Check back soon!',
            
            // Colors
            backgroundColor: this.config.backgroundColor || '#f8f9fa',
            primaryColor: this.config.primaryColor || '#0d6efd',
            titleColor: this.config.titleColor || '#212529',
            subtitleColor: this.config.subtitleColor || '#6c757d',
            cardBackgroundColor: this.config.cardBackgroundColor || '#ffffff',
            buttonColor: this.config.buttonColor || '#0d6efd',
            buttonTextColor: this.config.buttonTextColor || '#ffffff',
            
            // Employment type colors
            fullTimeColor: this.config.fullTimeColor || '#0d6efd',
            partTimeColor: this.config.partTimeColor || '#17a2b8',
            contractColor: this.config.contractColor || '#ffc107',
            internshipColor: this.config.internshipColor || '#6c757d',
            
            // Typography
            titleSize: this.config.titleSize || 42,
            subtitleSize: this.config.subtitleSize || 18,
            cardTitleSize: this.config.cardTitleSize || 22,
            descriptionSize: this.config.descriptionSize || 15,
            
            // Spacing
            padding: this.config.padding || 60,
            containerWidth: this.config.containerWidth || 1200,
            
            // Application settings
            applicationEmail: this.config.applicationEmail || '',
            applicationUrl: this.config.applicationUrl || ''
        };

        // Determine application method
        if (this.config.applicationEmail) {
            this.applicationMethod = 'email';
        } else if (this.config.applicationUrl) {
            this.applicationMethod = 'url';
        } else {
            this.applicationMethod = 'alert';
        }

        this.onConfigChange();
    }

    onConfigChange(): void {
        this.configChange.emit(this.config);
    }

    onApplicationMethodChange(): void {
        // Clear other application methods
        if (this.applicationMethod === 'email') {
            this.config.applicationUrl = '';
        } else if (this.applicationMethod === 'url') {
            this.config.applicationEmail = '';
        } else {
            this.config.applicationEmail = '';
            this.config.applicationUrl = '';
        }
        this.onConfigChange();
    }
}
