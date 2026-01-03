import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CustomPagesServiceProxy, ApiServiceProxy, PageListItemDto, CreatePageDto, PageLimitsDto } from '../../../core/services/service-proxies';

@Component({
    selector: 'app-page-management',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ButtonModule,
        TableModule,
        CardModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextModule,
        CheckboxModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService,ApiServiceProxy, CustomPagesServiceProxy ],
    templateUrl: './page-management.component.html',
    styleUrl: './page-management.component.scss'
})
export class PageManagementComponent implements OnInit {
    pages = signal<PageListItemDto[]>([]);
    loading = signal(false);
    showCreateDialog = signal(false);
    pageLimits = signal<PageLimitsDto>(PageLimitsDto.fromJS({ maxPages: 0, currentPages: 0, canCreateMore: false }));

    newPage: CreatePageDto = CreatePageDto.fromJS({
        name: '',
        slug: '',
        title: '',
        description: '',
        isPublic: true,
        requiresAuth: false,
        showInNavbar: true,
        showInFooter: false
    });

    constructor(
        private customPagesService: CustomPagesServiceProxy,
        private apiService: ApiServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.loadPages();
        this.loadLimits();
    }

    loadPages() {
        this.loading.set(true);
        this.customPagesService.all().subscribe({
            next: (pages) => {
                this.pages.set(pages);
                this.loading.set(false);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load pages'
                });
                this.loading.set(false);
            }
        });
    }

    loadLimits() {
        this.customPagesService.limits().subscribe({
            next: (limits) => {
                this.pageLimits.set(limits);
            },
            error: (error) => {
                console.error('Failed to load page limits', error);
            }
        });
    }

    openCreateDialog() {
        const limits = this.pageLimits();
        if (!limits.canCreateMore) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Limit Reached',
                detail: `You have reached the maximum of ${limits.maxPages} pages for your subscription. Upgrade to create more pages.`
            });
            return;
        }
        this.showCreateDialog.set(true);
    }

    closeCreateDialog() {
        this.showCreateDialog.set(false);
        this.resetNewPage();
    }

    resetNewPage() {
        this.newPage = CreatePageDto.fromJS({
            name: '',
            slug: '',
            title: '',
            description: '',
            isPublic: true,
            requiresAuth: false,
            showInNavbar: true,
            showInFooter: false
        });
    }

    onNameChange() {
        // Auto-generate slug from name
        if (this.newPage.name && !this.newPage.slug) {
            this.newPage.slug = this.generateSlug(this.newPage.name);
        }
        // Auto-fill title if empty
        if (this.newPage.name && !this.newPage.title) {
            this.newPage.title = this.newPage.name;
        }
    }

    generateSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    createPage() {
        if (!this.newPage.name || !this.newPage.slug || !this.newPage.title) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Name, slug, and title are required'
            });
            return;
        }

        this.apiService.customPagesPost(this.newPage).subscribe({
            next: (page) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Page created successfully'
                });
                this.closeCreateDialog();
                this.loadPages();
                this.loadLimits();
                // Navigate to page editor
                this.router.navigate(['/admin/pages/edit', page.id]);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to create page'
                });
            }
        });
    }

    editPage(page: PageListItemDto) {
        this.router.navigate(['/admin/custom-pages/edit', page.id]);
    }

    togglePageStatus(page: PageListItemDto) {
        // Toggle status implementation using status endpoint
        const newStatus = !page.isActive;
        // Note: Implement this when backend status toggle is available
        this.messageService.add({
            severity: 'info',
            summary: 'Not Implemented',
            detail: 'Status toggle will be available soon'
        });
    }

    duplicatePage(page: PageListItemDto) {
        this.customPagesService.duplicate(page.id).subscribe({
            next: (duplicatedPage) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Page "${page.name}" duplicated successfully`
                });
                this.loadPages();
                this.loadLimits();
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to duplicate page'
                });
            }
        });
    }

    deletePage(page: PageListItemDto) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${page.name}"? This action cannot be undone.`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.apiService.customPagesDelete(page.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Page deleted successfully'
                        });
                        this.loadPages();
                        this.loadLimits();
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete page'
                        });
                    }
                });
            }
        });
    }

    getSeverity(isActive: boolean): 'success' | 'warning' {
        return isActive ? 'success' : 'warning';
    }
}
