import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CustomPageTemplateService, CustomPageTemplate, PageTemplate } from '../../../core/services/custom-page-template.service';
import { ThemeApplicationService, ThemeApplicationProgress } from '../../../core/services/theme-application.service';
import { Router } from '@angular/router';
import { WIDGET_TYPES } from '../../../building-blocks/widget-registry';

@Component({
    selector: 'app-page-theme-browser',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        CardModule,
        TabViewModule,
        InputTextModule,
        ProgressSpinnerModule,
        ChipModule,
        TagModule
    ],
    providers: [MessageService, CustomPageTemplateService, ThemeApplicationService],
    templateUrl: './page-theme-browser.component.html',
    styleUrl: './page-theme-browser.component.scss'
})
export class PageThemeBrowserComponent implements OnInit {
    visible = false;
    themes: CustomPageTemplate[] = [];
    filteredThemes: CustomPageTemplate[] = [];
    
    activeCategoryIndex = 0;
    selectedCategory: 'all' | 'funeral' | 'ngo' | 'ecommerce' | 'services' = 'all';
    categories: Array<{ label: string; key: 'all' | 'funeral' | 'ngo' | 'ecommerce' | 'services' }> = [
        { label: 'All', key: 'all' },
        { label: 'Funeral', key: 'funeral' },
        { label: 'NGO', key: 'ngo' },
        { label: 'Ecommerce', key: 'ecommerce' },
        { label: 'Services', key: 'services' }
    ];
    
    searchQuery = '';
    showPremiumOnly = false;
    
    selectedTheme: CustomPageTemplate | null = null;
    showPreview = false;
    selectedPreviewPageIndex = 0;
    
    applying = false;
    applicationProgress: ThemeApplicationProgress | null = null;

    subscriptionInfo: { canApply: boolean; limit: number; current: number; remaining: number } | null = null;

    constructor(
        private templateService: CustomPageTemplateService,
        private applicationService: ThemeApplicationService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadThemes();
    }

    open(): void {
        this.visible = true;
        this.loadThemes();
    }

    close(): void {
        this.visible = false;
        this.selectedTheme = null;
        this.showPreview = false;
        this.selectedPreviewPageIndex = 0;
    }

    loadThemes(): void {
        this.themes = this.templateService.getAllTemplates();
        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.themes];

        // Category filter
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === this.selectedCategory);
        }

        // Premium filter
        if (this.showPremiumOnly) {
            filtered = filtered.filter(t => t.isPremium);
        }

        // Search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.name.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query)
            );
        }

        this.filteredThemes = filtered;
    }

    onCategoryChange(index: number): void {
        const selected = this.categories[index];
        this.activeCategoryIndex = index;
        this.selectedCategory = selected ? selected.key : 'all';
        this.applyFilters();
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onPremiumFilterChange(): void {
        this.applyFilters();
    }

    async previewTheme(theme: CustomPageTemplate): Promise<void> {
        this.selectedTheme = theme;
        this.showPreview = true;
        this.selectedPreviewPageIndex = 0;

        // Check subscription limits
        try {
            this.subscriptionInfo = await this.applicationService.checkSubscriptionLimits(theme.pages.length);
        } catch (error) {
            console.error('Error checking subscription limits:', error);
        }
    }

    closePreview(): void {
        this.showPreview = false;
        this.selectedTheme = null;
        this.subscriptionInfo = null;
        this.selectedPreviewPageIndex = 0;
    }

    async applyTheme(theme: CustomPageTemplate): Promise<void> {
        // Check subscription limits first
        const limits = await this.applicationService.checkSubscriptionLimits(theme.pages.length);
        
        if (!limits.canApply) {
            this.messageService.add({
                severity: 'error',
                summary: 'Subscription Limit Reached',
                detail: `You can only have ${limits.limit} pages. You currently have ${limits.current} pages and this theme requires ${theme.pages.length} pages. Please delete ${theme.pages.length - limits.remaining} page(s) or upgrade your subscription.`,
                life: 8000
            });
            return;
        }

        this.applying = true;
        this.applicationProgress = {
            totalPages: theme.pages.length,
            createdPages: 0,
            currentPage: '',
            status: 'pending'
        };

        try {
            const result = await this.applicationService.applyTheme(theme, (progress) => {
                this.applicationProgress = progress;
            });

            if (result.success) {
                // Wait a bit to show completion
                setTimeout(() => {
                    this.close();
                    this.applying = false;
                    this.applicationProgress = null;
                    
                    // Navigate to page management to see created pages
                    this.router.navigate(['/admin/custom-pages']);
                }, 1500);
            } else {
                // Show errors but stay on dialog
                this.applying = false;
                this.applicationProgress = null;
            }

        } catch (error: any) {
            console.error('Error applying theme:', error);
            this.applying = false;
            this.applicationProgress = null;
            
            this.messageService.add({
                severity: 'error',
                summary: 'Error Applying Theme',
                detail: error.message || 'An unexpected error occurred',
                life: 5000
            });
        }
    }

    getSeverityForCategory(category: string): 'success' | 'info' | 'warning' | 'danger' {
        switch ((category || '').toLowerCase()) {
            case 'funeral': return 'info';
            case 'ngo': return 'success';
            case 'ecommerce': return 'warning';
            case 'services': return 'danger';
            default: return 'info';
        }
    }

    getColorSchemePreview(theme: CustomPageTemplate): string {
        if (!theme.colorScheme) return '';
        return `linear-gradient(135deg, ${theme.colorScheme.primary} 0%, ${theme.colorScheme.secondary} 100%)`;
    }

    selectPreviewPage(index: number): void {
        this.selectedPreviewPageIndex = index;
    }

    getActivePreviewPage(): PageTemplate | null {
        if (!this.selectedTheme?.pages?.length) {
            return null;
        }
        return this.selectedTheme.pages[this.selectedPreviewPageIndex] || this.selectedTheme.pages[0];
    }

    getPreviewWidgets(page: PageTemplate | null): any[] {
        if (!page?.widgets?.length) {
            return [];
        }

        return page.widgets.map((widget: any, index: number) => {
            const rawConfig = widget?.config;
            const settings =
                widget?.settings ??
                (rawConfig && typeof rawConfig === 'object' && rawConfig.settings ? rawConfig.settings : rawConfig) ??
                {};
            const layout = widget?.layout ?? (rawConfig && typeof rawConfig === 'object' ? rawConfig.layout : undefined);
            const widgetType = widget?.type ?? '';
            const widgetDefinition = WIDGET_TYPES.find((item) => item.name === widgetType);

            return {
                id: widget?.id ?? `preview-widget-${index}`,
                type: widgetType,
                settings: { ...(widgetDefinition?.defaultConfig || {}), ...(settings || {}) },
                layout
            };
        });
    }

    getWidgetComponent(widgetType: string): any {
        const widgetDefinition = WIDGET_TYPES.find((w) => w.name === widgetType);
        return widgetDefinition?.component || null;
    }
}
