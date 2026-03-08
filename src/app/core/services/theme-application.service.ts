import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CustomPagesServiceProxy, CreatePageDto, CustomPageDto, ApiServiceProxy, PageWidgetDto } from './service-proxies';
import { CustomPageTemplate, ThemeColorScheme } from './custom-page-template.service';

export interface ThemeApplicationProgress {
    totalPages: number;
    createdPages: number;
    currentPage: string;
    status: 'pending' | 'creating' | 'completed' | 'error';
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ThemeApplicationService {
    constructor(
        private customPageService: CustomPagesServiceProxy,
        private apiService: ApiServiceProxy,
        private messageService: MessageService
    ) {}

    async applyTheme(
        theme: CustomPageTemplate,
        onProgress?: (progress: ThemeApplicationProgress) => void
    ): Promise<{ success: boolean; createdPages: string[]; errors: string[] }> {
        const createdPages: string[] = [];
        const errors: string[] = [];
        const totalPages = theme.pages.length;

        try {
            // Get existing pages to check for slug conflicts
            const existingPagesResponse = await firstValueFrom(this.customPageService.all());
            const existingPages = (existingPagesResponse as any)?.result || [];
            const existingSlugs = existingPages
                .map((p: any) => (p.slug ? String(p.slug).toLowerCase() : ''))
                .filter((s: string) => !!s);

            // Report initial progress
            if (onProgress) {
                onProgress({
                    totalPages,
                    createdPages: 0,
                    currentPage: '',
                    status: 'pending'
                });
            }

            // Create each page
            for (let i = 0; i < theme.pages.length; i++) {
                const pageTemplate = theme.pages[i];
                
                if (onProgress) {
                    onProgress({
                        totalPages,
                        createdPages: i,
                        currentPage: pageTemplate.name,
                        status: 'creating'
                    });
                }

                try {
                    // Resolve slug conflicts
                    const slug = this.resolveSlugConflict(pageTemplate.slug, existingSlugs);
                    existingSlugs.push(slug.toLowerCase());

                    // Build create DTO
                    const dto = CreatePageDto.fromJS({
                        name: pageTemplate.name,
                        slug,
                        title: pageTemplate.title,
                        description: pageTemplate.description,
                        content: this.mapThemeWidgetsToPageContent(pageTemplate.widgets),
                        isPublic: pageTemplate.isPublic ?? true,
                        isActive: true,
                        showInNavbar: pageTemplate.showInNavbar ?? !!pageTemplate.showInNavigation,
                        showInFooter: pageTemplate.showInFooter ?? false,
                        navbarOrder: pageTemplate.navbarOrder ?? pageTemplate.navigationOrder ?? 0,
                        footerOrder: pageTemplate.footerOrder
                    });

                    // Create page via API
                    const created = await firstValueFrom(this.apiService.customPagesPost(dto));
                    const createdName =
                        (created as any)?.result?.name || (created as any)?.name || pageTemplate.name;
                    createdPages.push(createdName);

                } catch (error: any) {
                    const errorMsg = `Failed to create page "${pageTemplate.name}": ${error.message || 'Unknown error'}`;
                    errors.push(errorMsg);
                    console.error(errorMsg, error);
                    // Continue with next page instead of stopping
                }
            }

            // Apply color scheme to tenant settings if all pages created successfully
            // TODO: Implement color scheme application when tenant settings API is ready
            /*
            if (errors.length === 0 && theme.colorScheme) {
                try {
                    await this.applyColorScheme(theme.colorScheme);
                } catch (error: any) {
                    console.warn('Failed to apply color scheme:', error);
                    // Don't treat this as a critical error
                }
            }
            */

            // Report completion
            if (onProgress) {
                onProgress({
                    totalPages,
                    createdPages: createdPages.length,
                    currentPage: '',
                    status: errors.length === 0 ? 'completed' : 'error',
                    error: errors.length > 0 ? errors.join('; ') : undefined
                });
            }

            // Show success/warning message
            if (createdPages.length > 0) {
                if (errors.length === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Theme Applied Successfully',
                        detail: `Created ${createdPages.length} pages: ${createdPages.join(', ')}`,
                        life: 5000
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Theme Partially Applied',
                        detail: `Created ${createdPages.length} of ${totalPages} pages. ${errors.length} page(s) failed.`,
                        life: 6000
                    });
                }
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Theme Application Failed',
                    detail: 'No pages were created. Please check your subscription limits and try again.',
                    life: 5000
                });
            }

            return {
                success: errors.length === 0 && createdPages.length === totalPages,
                createdPages,
                errors
            };

        } catch (error: any) {
            const errorMsg = `Critical error applying theme: ${error.message || 'Unknown error'}`;
            console.error(errorMsg, error);
            
            if (onProgress) {
                onProgress({
                    totalPages,
                    createdPages: createdPages.length,
                    currentPage: '',
                    status: 'error',
                    error: errorMsg
                });
            }

            this.messageService.add({
                severity: 'error',
                summary: 'Error Applying Theme',
                detail: errorMsg,
                life: 5000
            });

            return {
                success: false,
                createdPages,
                errors: [errorMsg, ...errors]
            };
        }
    }

    private resolveSlugConflict(slug: string, existingSlugs: string[]): string {
        let newSlug = slug;
        let counter = 1;
        
        while (existingSlugs.includes(newSlug.toLowerCase())) {
            newSlug = `${slug}-${counter}`;
            counter++;
        }
        
        return newSlug;
    }

    private mapThemeWidgetsToPageContent(widgets: any[]): PageWidgetDto[] {
        return (widgets || []).map((widget: any, index: number) => {
            const pageWidget = new PageWidgetDto();
            const widgetType = widget?.type || '';
            const settings = widget?.settings ?? widget?.config ?? {};
            const layout = widget?.layout;

            pageWidget.id = widget?.id || `${widgetType || 'widget'}-${index + 1}`;
            pageWidget.type = widgetType;
            pageWidget.config = {
                settings,
                ...(layout ? { layout } : {})
            };
            pageWidget.order = index;

            return pageWidget;
        });
    }

    private async applyColorScheme(colors: ThemeColorScheme): Promise<void> {
        // TODO: Implement when tenant settings service has update method
        console.log('Color scheme application not yet implemented');
    }

    async checkSubscriptionLimits(themePageCount: number): Promise<{ canApply: boolean; limit: number; current: number; remaining: number }> {
        try {
            const existingPagesResponse = await firstValueFrom(this.customPageService.all());
            const existingPages = existingPagesResponse?.result || [];
            const currentCount = existingPages.length;
            
            // TODO: Get actual subscription limit from tenant settings
            // For now, using a placeholder - this should be retrieved from backend
            const limit = 25; // Default Premium limit
            
            const remaining = Math.max(0, limit - currentCount);
            const canApply = remaining >= themePageCount;

            return {
                canApply,
                limit,
                current: currentCount,
                remaining
            };
        } catch (error) {
            console.error('Error checking subscription limits:', error);
            // If we can't check, assume it's okay (fail open)
            return {
                canApply: true,
                limit: 999,
                current: 0,
                remaining: 999
            };
        }
    }

    async previewTheme(theme: CustomPageTemplate): Promise<{ 
        pageCount: number; 
        pageNames: string[]; 
        widgetCount: number;
        estimatedSizeKB: number;
    }> {
        const pageNames = theme.pages.map(p => p.name);
        const totalWidgets = theme.pages.reduce((sum, page) => sum + page.widgets.length, 0);
        
        // Rough estimate of JSON size
        const jsonString = JSON.stringify(theme.pages);
        const estimatedSizeKB = Math.ceil(jsonString.length / 1024);

        return {
            pageCount: theme.pages.length,
            pageNames,
            widgetCount: totalWidgets,
            estimatedSizeKB
        };
    }
}
