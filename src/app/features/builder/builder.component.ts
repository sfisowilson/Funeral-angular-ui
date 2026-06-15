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
                <!-- Top bar — all global controls consolidated here -->
                <div class="builder-topbar">
                    <div class="topbar-left">
                        <button class="topbar-back" (click)="goBack()" title="Back to page management">
                            <i class="pi pi-arrow-left"></i>
                        </button>
                        <span class="topbar-page-name">{{ store.pageSettings()?.name || pageName() }}</span>
                    </div>

                    <div class="topbar-center">
                        <!-- Breakpoint switcher -->
                        <div class="breakpoint-group">
                            <button class="bp-btn" [class.active]="store.activeBreakpoint() === 'desktop'" (click)="store.activeBreakpoint.set('desktop')" title="Desktop (1200px+)">
                                <i class="pi pi-desktop"></i>
                            </button>
                            <button class="bp-btn" [class.active]="store.activeBreakpoint() === 'tablet'" (click)="store.activeBreakpoint.set('tablet')" title="Tablet (768px)">
                                <i class="pi pi-tablet"></i>
                            </button>
                            <button class="bp-btn" [class.active]="store.activeBreakpoint() === 'mobile'" (click)="store.activeBreakpoint.set('mobile')" title="Mobile (375px)">
                                <i class="pi pi-mobile"></i>
                            </button>
                        </div>

                        <!-- Undo / Redo -->
                        <div class="action-group">
                            <button class="topbar-action" [disabled]="!store.canUndo()" (click)="store.undo()" [title]="store.undoLabel()">
                                <i class="pi pi-undo"></i>
                            </button>
                            <button class="topbar-action" [disabled]="!store.canRedo()" (click)="store.redo()" [title]="store.redoLabel()">
                                <i class="pi pi-refresh"></i>
                            </button>
                        </div>

                        <!-- Preview toggle -->
                        <button class="preview-toggle" [class.active]="store.previewMode()" (click)="togglePreview()">
                            <i class="pi pi-eye"></i>
                            <span>{{ store.previewMode() ? 'Editing' : 'Preview' }}</span>
                        </button>
                    </div>

                    <div class="topbar-right">
                        @if (saveError()) {
                            <span class="save-error">Save failed — retry</span>
                        }
                        <button class="topbar-settings" (click)="showPageSettings.set(!showPageSettings())" title="Page Settings">
                            <i class="pi pi-cog"></i>
                        </button>
                        <button
                            class="topbar-save"
                            [class.topbar-save--dirty]="hasUnsaved()"
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

            /* ── Top bar ──────────────────────────────── */
            .builder-topbar {
                height: 52px;
                flex-shrink: 0;
                background: #1e293b;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
                z-index: 20;
                gap: 12px;
            }

            .topbar-left {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 0;
            }

            .topbar-back {
                width: 32px;
                height: 32px;
                border: none;
                background: rgba(255,255,255,0.08);
                cursor: pointer;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94a3b8;
                flex-shrink: 0;
            }
            .topbar-back:hover { background: rgba(255,255,255,0.15); color: #e2e8f0; }

            .topbar-page-name {
                font-size: 14px;
                font-weight: 600;
                color: #f1f5f9;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .topbar-center {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .breakpoint-group {
                display: flex;
                background: rgba(255,255,255,0.06);
                border-radius: 6px;
                padding: 2px;
                gap: 1px;
            }

            .bp-btn {
                width: 32px;
                height: 28px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                font-size: 14px;
            }
            .bp-btn:hover { color: #cbd5e1; }
            .bp-btn.active { background: #3b82f6; color: white; }

            .action-group {
                display: flex;
                gap: 2px;
            }

            .topbar-action {
                width: 30px;
                height: 30px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94a3b8;
            }
            .topbar-action:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
            .topbar-action:disabled { opacity: 0.3; cursor: not-allowed; }

            .preview-toggle {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 5px 12px;
                border: 1px solid rgba(255,255,255,0.12);
                background: transparent;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                color: #94a3b8;
            }
            .preview-toggle:hover { border-color: rgba(255,255,255,0.25); color: #e2e8f0; }
            .preview-toggle.active { background: #3b82f6; border-color: #3b82f6; color: white; }

            .topbar-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .save-error {
                font-size: 11px;
                color: #fca5a5;
            }

            .topbar-settings {
                width: 32px;
                height: 32px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #94a3b8;
            }
            .topbar-settings:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }

            .topbar-save {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 16px;
                border: none;
                background: #3b82f6;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                color: white;
                height: 34px;
            }
            .topbar-save:hover { background: #2563eb; }
            .topbar-save:disabled { opacity: 0.5; cursor: not-allowed; }
            .topbar-save--dirty { background: #f59e0b; }
            .topbar-save--dirty:hover { background: #d97706; }

            .unsaved-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: white;
                display: inline-block;
            }

            /* ── 3-panel layout ──────────────────────── */
            .builder-layout {
                flex: 1;
                overflow: hidden;
                display: grid;
                grid-template-columns: 260px 1fr 340px;
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
    readonly showPageSettings = signal(false);

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

    togglePreview(): void {
        this.store.previewMode.set(!this.store.previewMode());
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
