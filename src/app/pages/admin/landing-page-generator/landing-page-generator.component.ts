import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { LandingPageTemplateService, LandingPageTemplate } from './landing-page-template.service';

export interface TemplateCategory {
    name: string;
    icon: string;
    description: string;
}

@Component({
    selector: 'app-landing-page-generator',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, DialogModule, ConfirmDialogModule, DropdownModule, CardModule, ImageModule, ProgressSpinnerModule, TagModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './landing-page-generator.component.html',
    styles: [`
        .template-card {
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .template-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .template-card.selected {
            border: 3px solid #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .category-badge {
            font-size: 0.75rem;
            font-weight: 600;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 0.25rem 0;
            display: flex;
            align-items: center;
        }
        .feature-list li::before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            margin-right: 0.5rem;
        }
        .template-thumbnail {
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
        }
        .preview-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
    `]
})
export class LandingPageGeneratorComponent {
    templates = signal<LandingPageTemplate[]>([]);
    categories = signal<TemplateCategory[]>([]);
    selectedTemplate: LandingPageTemplate | null = null;
    selectedCategory: string | null = null;
    isLoading = signal<boolean>(false);
    isGenerating = signal<boolean>(false);
    showPreviewDialog = false;
    
    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private templateService: LandingPageTemplateService
    ) {
        this.initializeCategories();
    }

    ngOnInit() {
        this.loadTemplates();
    }

    private initializeCategories(): void {
        const cats: TemplateCategory[] = [
            { name: 'Hair Salon', icon: 'pi pi-cut', description: 'Templates for hair salons and beauty studios' },
            { name: 'Construction', icon: 'pi pi-building', description: 'Templates for construction companies' },
            { name: 'NGO', icon: 'pi pi-heart', description: 'Templates for non-profit organizations' },
            { name: 'Tailor', icon: 'pi pi-pencil', description: 'Templates for tailoring services' },
            { name: 'Art Shop', icon: 'pi pi-palette', description: 'Templates for art galleries and shops' },
            { name: 'Professional', icon: 'pi pi-user', description: 'Templates for professional profiles' }
        ];
        this.categories.set(cats);
    }

    private loadTemplates(): void {
        this.isLoading.set(true);
        
        // Use static templates for now, can be replaced with API call
        setTimeout(() => {
            const templates = this.templateService.getStaticTemplates();
            this.templates.set(templates);
            this.isLoading.set(false);
        }, 500);
    }

    get filteredTemplates(): LandingPageTemplate[] {
        let filtered = this.templates();
        
        if (this.selectedCategory) {
            filtered = filtered.filter(template => template.category === this.selectedCategory);
        }
        
        return filtered;
    }

    selectTemplate(template: LandingPageTemplate): void {
        this.selectedTemplate = template;
    }

    previewTemplate(template: LandingPageTemplate): void {
        this.selectedTemplate = template;
        this.showPreviewDialog = true;
    }

    generateLandingPage(): void {
        if (!this.selectedTemplate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Template Selected',
                detail: 'Please select a template to generate your landing page',
                life: 3000
            });
            return;
        }

        this.confirmationService.confirm({
            header: 'Generate Landing Page',
            message: `Are you sure you want to generate a landing page using the "${this.selectedTemplate.name}" template? This will create a new landing page with sample content.`,
            accept: () => {
                this.performGeneration();
            }
        });
    }

    private performGeneration(): void {
        this.isGenerating.set(true);
        
        // Generate page components using the service
        const pageComponents = this.templateService.generatePageComponents(this.selectedTemplate!.id);
        
        // Simulate generation process
        setTimeout(() => {
            this.isGenerating.set(false);
            
            // Store generated components in localStorage for the page builder to use
            localStorage.setItem('generatedPageComponents', JSON.stringify({
                templateId: this.selectedTemplate!.id,
                templateName: this.selectedTemplate!.name,
                components: pageComponents
            }));
            
            this.messageService.add({
                severity: 'success',
                summary: 'Landing Page Generated',
                detail: `Successfully generated landing page using "${this.selectedTemplate!.name}" template`,
                life: 3000
            });

            // Redirect to page builder
            setTimeout(() => {
                this.router.navigate(['/admin/pages/page-builder']);
            }, 1500);
        }, 2000);
    }

    getCategoryIcon(categoryName: string): string {
        const category = this.categories().find(cat => cat.name === categoryName);
        return category?.icon || 'pi pi-file';
    }

    getTenantTypeBadgeClass(tenantTypes: string[]): string {
        if (tenantTypes.includes('Basic')) return 'p-tag-info';
        if (tenantTypes.includes('Standard')) return 'p-tag-warning';
        if (tenantTypes.includes('Premium')) return 'p-tag-success';
        return 'p-tag-secondary';
    }

    getTenantTypeLabel(tenantTypes: string[]): string {
        if (tenantTypes.includes('Basic')) return 'Basic+';
        if (tenantTypes.includes('Standard')) return 'Standard+';
        if (tenantTypes.includes('Premium')) return 'Premium';
        return 'All';
    }
}
