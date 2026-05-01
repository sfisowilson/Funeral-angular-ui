import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServiceProxy, CustomPageDto, PageMetaTagsDto, PageWidgetDto, UpdatePageDto } from '../../core/services/service-proxies';
import { PageDocumentStore } from '../../builder/core/page-document.store';
import { flatToV3, isV3Document } from '../../builder/core/migration/flat-to-v3.util';
import { v3ToFlat } from '../../builder/core/migration/v3-to-flat.util';
import { WidgetConfig } from '../../building-blocks/widget-config';
import { LeftPanelComponent } from '../../builder/left-panel/left-panel.component';
import { CanvasAreaComponent } from '../../builder/canvas-area/canvas-area.component';
import { RightPanelComponent } from '../../builder/right-panel/right-panel.component';

@Component({
    selector: 'app-builder',
    standalone: true,
    imports: [CommonModule, LeftPanelComponent, CanvasAreaComponent, RightPanelComponent],
    template: `
        <div class="builder-shell">
            <!-- Loading overlay -->
            @if (loading()) {
                <div class="builder-overlay">
                    <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #6b7280;"></i>
                    <span>Loading page…</span>
                </div>
            }

            <!-- Error overlay -->
            @if (error()) {
                <div class="builder-overlay builder-overlay--error">
                    <i class="pi pi-exclamation-circle" style="font-size: 2rem; color: #ef4444;"></i>
                    <p>{{ error() }}</p>
                    <button class="btn-secondary" (click)="goBack()">Go back</button>
                </div>
            }

            <!-- Builder UI (rendered immediately to avoid layout shift, hidden via opacity) -->
            <div class="builder-ui" [class.builder-ui--hidden]="loading() || !!error()">
                <!-- Top bar -->
                <div class="builder-topbar">
                    <div class="topbar-left">
                        <button class="btn-icon" (click)="goBack()" title="Back to page management">
                            <i class="pi pi-arrow-left"></i>
                        </button>
                        <span class="page-name-label">{{ store.pageSettings()?.name || pageName() }}</span>
                    </div>

                    <div class="topbar-right">
                        @if (saveError()) {
                            <span class="save-error">Save failed — retry</span>
                        }
                        <button
                            class="btn-secondary"
                            [class.btn-secondary--dirty]="hasUnsaved()"
                            [disabled]="saving()"
                            (click)="savePage()"
                            title="Save (Ctrl+S)"
                        >
                            @if (saving()) {
                                <i class="pi pi-spin pi-spinner"></i>
                                <span>Saving…</span>
                            } @else {
                                <i class="pi pi-save"></i>
                                <span>Save</span>
                                @if (hasUnsaved()) {
                                    <span class="unsaved-dot"></span>
                                }
                            }
                        </button>
                    </div>
                </div>

                <!-- 3-panel layout -->
                <div class="builder-layout">
                    <app-builder-left-panel />
                    <app-builder-canvas-area />
                    <app-builder-right-panel />
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100vh;
                overflow: hidden;
            }

            .builder-shell {
                width: 100%;
                height: 100%;
                position: relative;
                background: #f0f2f5;
            }

            /* Full-screen overlays */
            .builder-overlay {
                position: absolute;
                inset: 0;
                z-index: 100;
                background: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-size: 14px;
                color: #6b7280;
            }

            .builder-overlay--error {
                background: #fff5f5;
            }

            .builder-overlay p {
                margin: 0;
            }

            /* Full-height flex column */
            .builder-ui {
                display: flex;
                flex-direction: column;
                height: 100%;
                transition: opacity 0.15s;
            }

            .builder-ui--hidden {
                opacity: 0;
                pointer-events: none;
            }

            /* Top bar */
            .builder-topbar {
                height: 48px;
                flex-shrink: 0;
                background: white;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                z-index: 10;
            }

            .topbar-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .topbar-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .page-name-label {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
            }

            .save-error {
                font-size: 12px;
                color: #ef4444;
            }

            /* 3-panel layout */
            .builder-layout {
                flex: 1;
                overflow: hidden;
                display: grid;
                grid-template-columns: 250px 1fr 320px;
            }

            /* Buttons */
            .btn-icon {
                width: 32px;
                height: 32px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
                font-size: 16px;
            }

            .btn-icon:hover {
                background: #f3f4f6;
                color: #111827;
            }

            .btn-secondary {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 16px;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                color: #374151;
                height: 32px;
            }

            .btn-secondary:hover {
                border-color: #9ca3af;
            }

            .btn-secondary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-secondary--dirty {
                border-color: #f59e0b;
            }

            .unsaved-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #f59e0b;
                display: inline-block;
                margin-left: 2px;
                flex-shrink: 0;
            }
        `
    ]
})
export class BuilderComponent implements OnInit, OnDestroy {
    readonly store = inject(PageDocumentStore);

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly api = inject(ApiServiceProxy);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly error = signal<string | null>(null);
    readonly saveError = signal(false);
    readonly pageName = signal('Untitled Page');

    private savedMutationCount = 0;
    readonly hasUnsaved = computed(() => this.store.mutationCount() !== this.savedMutationCount);

    private pageId = '';
    private pageDto: CustomPageDto | null = null;

    ngOnInit(): void {
        this.pageId = this.route.snapshot.paramMap.get('pageId') ?? '';
        if (!this.pageId) {
            this.error.set('No page ID provided.');
            this.loading.set(false);
            return;
        }
        this.loadPage();
    }

    private loadPage(): void {
        this.loading.set(true);
        this.error.set(null);

        this.api.customPagesGet(this.pageId).subscribe({
            next: (res) => {
                this.pageDto = res.result;
                this.pageName.set(res.result?.name ?? 'Untitled Page');

                const rawContent: PageWidgetDto[] = res.result?.content ?? [];

                // Detect v3 document stored as a single widget config
                const firstConfig = rawContent[0]?.config;
                if (rawContent.length === 1 && isV3Document(firstConfig)) {
                    this.store.setDocument(firstConfig);
                } else {
                    // Convert flat PageWidgetDto[] → WidgetConfig[] → v3 PageDocument
                    const flat: WidgetConfig[] = rawContent.map((w) => ({
                        id: w.id ?? (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function' ? (crypto as any).randomUUID() as string : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); })),
                        type: w.type ?? '',
                        settings: (w.config as any)?.settings ?? w.config ?? {},
                        blockStyles: (w.config as any)?.blockStyles,
                        visibility: (w.config as any)?.visibility,
                        styleOverrides: (w.config as any)?.styleOverrides,
                        children: (w.config as any)?.children,
                        layout: (w.config as any)?.layout ?? { column: 0, columnSpan: 12, row: 0 }
                    }));
                    this.store.setDocument(flatToV3(flat));
                }

                this.loading.set(false);
                this.savedMutationCount = this.store.mutationCount();

                this.store.pageSettings.set({
                    name: res.result?.name ?? '',
                    slug: res.result?.slug ?? '',
                    title: res.result?.title ?? '',
                    description: res.result?.description ?? '',
                    isPublic: res.result?.isPublic ?? false,
                    requiresAuth: res.result?.requiresAuth ?? false,
                    showInNavbar: res.result?.showInNavbar ?? false,
                    navbarOrder: res.result?.navbarOrder ?? null,
                    showInFooter: res.result?.showInFooter ?? false,
                    footerOrder: res.result?.footerOrder ?? null,
                    isActive: res.result?.isActive ?? true,
                    metaKeywords: res.result?.metaTags?.keywords ?? '',
                    metaOgTitle: res.result?.metaTags?.ogTitle ?? '',
                    metaOgDescription: res.result?.metaTags?.ogDescription ?? '',
                    metaOgImage: res.result?.metaTags?.ogImage ?? '',
                });
            },
            error: () => {
                this.error.set('Failed to load page. Please try again.');
                this.loading.set(false);
            }
        });
    }

    savePage(): void {
        if (this.saving()) return;
        const doc = this.store.document();
        if (!doc) return;

        this.saving.set(true);
        this.saveError.set(false);

        // Save the entire v3 document as a single PageWidgetDto so the round-trip
        // flatToV3 ↔ v3ToFlat is avoided (that path splits multi-block columns).
        const dto = new PageWidgetDto();
        dto.id = this.pageId;
        dto.type = '__v3_document';
        dto.config = doc as any;
        dto.order = 0;

        const existing = this.pageDto;
        const ps = this.store.pageSettings();
        const body = new UpdatePageDto();
        body.name = ps?.name ?? existing?.name;
        body.slug = ps?.slug ?? existing?.slug;
        body.title = ps?.title ?? existing?.title;
        body.description = ps?.description ?? existing?.description;
        body.isPublic = ps?.isPublic ?? existing?.isPublic ?? false;
        body.requiresAuth = ps?.requiresAuth ?? existing?.requiresAuth ?? false;
        body.showInNavbar = ps?.showInNavbar ?? existing?.showInNavbar ?? false;
        body.showInFooter = ps?.showInFooter ?? existing?.showInFooter ?? false;
        body.isActive = ps?.isActive ?? existing?.isActive ?? true;
        body.navbarOrder = ps?.navbarOrder ?? existing?.navbarOrder;
        body.footerOrder = ps?.footerOrder ?? existing?.footerOrder;
        body.isOnboardingPage = existing?.isOnboardingPage ?? false;
        body.isBlockingOnboarding = existing?.isBlockingOnboarding ?? false;
        body.requiresOnboardingApproval = existing?.requiresOnboardingApproval ?? false;
        const meta = new PageMetaTagsDto();
        meta.keywords = ps?.metaKeywords ?? existing?.metaTags?.keywords ?? '';
        meta.ogTitle = ps?.metaOgTitle ?? existing?.metaTags?.ogTitle ?? '';
        meta.ogDescription = ps?.metaOgDescription ?? existing?.metaTags?.ogDescription ?? '';
        meta.ogImage = ps?.metaOgImage ?? existing?.metaTags?.ogImage ?? '';
        body.metaTags = meta;
        body.content = [dto];
        body.footerContent = existing?.footerContent ?? [];

        this.api.customPagesPut(this.pageId, body).subscribe({
            next: () => {
                this.saving.set(false);
                this.savedMutationCount = this.store.mutationCount();
            },
            error: () => {
                this.saving.set(false);
                this.saveError.set(true);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/custom-pages']);
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const ctrl = event.ctrlKey || event.metaKey;
        if (!ctrl) return;

        if (event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.store.undo();
        } else if (event.key === 'z' && event.shiftKey) {
            event.preventDefault();
            this.store.redo();
        } else if (event.key === 'y') {
            event.preventDefault();
            this.store.redo();
        } else if (event.key === 's') {
            event.preventDefault();
            this.savePage();
        }
    }

    ngOnDestroy(): void {
        // Clean up store state when leaving the builder
        this.store.selectElement(null);
    }
}
