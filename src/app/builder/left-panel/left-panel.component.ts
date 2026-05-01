import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageDocumentStore } from '../core/page-document.store';
import { WIDGET_TYPES, WidgetType } from '../../building-blocks/widget-registry';
import { AddBlockCommand, AddSectionCommand, DeleteSectionCommand, DeleteBlockCommand } from '../core/commands/commands';
import { BlockNode, ColumnNode, SectionNode } from '../core/document.model';

type PanelTab = 'blocks' | 'layers' | 'settings';

// Widgets that shouldn't appear in the block library (internal/floating)
const HIDDEN_WIDGET_TYPES = new Set([
    'onboarding-stepper', 'onboarding-multi-submit-step', 'onboarding-global-calculator',
    'stepper-form', 'whatsapp'
]);

interface WidgetCategory {
    label: string;
    widgets: WidgetType[];
}

interface LayerNode {
    kind: 'section' | 'block';
    id: string;
    label: string;
    depth: number;
    /** Only on section kind */
    blockCount?: number;
    collapsed?: boolean;
}

function categorise(widgets: WidgetType[]): WidgetCategory[] {
    const cats: Record<string, WidgetType[]> = {
        'Layout': [],
        'Content': [],
        'Media': [],
        'Commerce': [],
        'NGO': [],
        'Forms': [],
        'Other': [],
    };
    for (const w of widgets) {
        if (HIDDEN_WIDGET_TYPES.has(w.name)) continue;
        if (w.shopFeature) { cats['Commerce'].push(w); continue; }
        if (w.name.startsWith('ngo-')) { cats['NGO'].push(w); continue; }
        if (['form', 'dynamic-entity-list'].includes(w.name)) { cats['Forms'].push(w); continue; }
        if (['hero', 'slider', 'parallax-section', 'split-screen', 'bento-grid',
             'glassmorphism-card', 'marquee', 'cta-banner'].includes(w.name)) {
            cats['Layout'].push(w); continue;
        }
        if (['gallery', 'image-content', 'video-embed', 'logo-cloud'].includes(w.name)) {
            cats['Media'].push(w); continue;
        }
        cats['Content'].push(w);
    }
    return Object.entries(cats)
        .filter(([, ws]) => ws.length > 0)
        .map(([label, widgets]) => ({ label, widgets }));
}

@Component({
    selector: 'app-builder-left-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="left-panel">
            <div class="icon-strip">
                <button
                    class="icon-btn"
                    [class.active]="activeTab() === 'blocks'"
                    (click)="setTab('blocks')"
                    title="Blocks"
                >
                    <i class="pi pi-th-large"></i>
                </button>
                <button
                    class="icon-btn"
                    [class.active]="activeTab() === 'layers'"
                    (click)="setTab('layers')"
                    title="Layers"
                >
                    <i class="pi pi-list"></i>
                </button>
                <button
                    class="icon-btn"
                    [class.active]="activeTab() === 'settings'"
                    (click)="setTab('settings')"
                    title="Page Settings"
                >
                    <i class="pi pi-cog"></i>
                </button>
            </div>

            <div class="panel-content">
                @if (activeTab() === 'blocks') {
                    <div class="panel-section">
                        <input
                            class="search-input"
                            type="text"
                            placeholder="Search blocks…"
                            [(ngModel)]="searchQuery"
                        />
                        @for (cat of filteredCategories(); track cat.label) {
                            <div class="cat-group">
                                <p class="panel-heading">{{ cat.label }}</p>
                                <div class="widget-grid">
                                    @for (w of cat.widgets; track w.name) {
                                        <button
                                            class="widget-tile"
                                            (click)="addWidget(w)"
                                            [title]="w.name"
                                            draggable="true"
                                            (dragstart)="onDragStart($event, w)"
                                        >
                                            <i class="bi bi-{{ w.icon }} widget-tile__icon"></i>
                                            <span class="widget-tile__label">{{ widgetLabel(w.name) }}</span>
                                        </button>
                                    }
                                </div>
                            </div>
                        }
                        @if (filteredCategories().length === 0) {
                            <p class="panel-placeholder">No blocks match "{{ searchQuery }}"</p>
                        }
                    </div>
                }
                @if (activeTab() === 'layers') {
                    <div class="panel-section">
                        @if (layerNodes().length === 0) {
                            <p class="panel-placeholder">No content on this page yet.</p>
                        }
                        @for (node of layerNodes(); track node.id + node.kind) {
                            @if (node.kind === 'section') {
                                <div
                                    class="layer-section"
                                    [class.selected]="store.selectedId() === node.id"
                                    (click)="store.selectElement(node.id)"
                                >
                                    <button
                                        class="layer-collapse-btn"
                                        (click)="$event.stopPropagation(); toggleCollapse(node.id)"
                                        [title]="collapsedSections().has(node.id) ? 'Expand' : 'Collapse'"
                                    >
                                        <i class="pi" [class.pi-chevron-right]="collapsedSections().has(node.id)" [class.pi-chevron-down]="!collapsedSections().has(node.id)"></i>
                                    </button>
                                    <i class="pi pi-table layer-icon"></i>
                                    <span class="layer-label">{{ node.label }}</span>
                                    <span class="layer-count">{{ node.blockCount }}</span>
                                    <button
                                        class="layer-del-btn"
                                        (click)="$event.stopPropagation(); deleteSection(node.id)"
                                        title="Delete section"
                                    >
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </div>
                            } @else {
                                <div
                                    class="layer-item"
                                    [class.selected]="store.selectedId() === node.id"
                                    [style.padding-left.px]="12 + node.depth * 16"
                                    (click)="store.selectElement(node.id)"
                                >
                                    <i class="pi pi-box layer-icon"></i>
                                    <span class="layer-label">{{ node.label }}</span>
                                    <button
                                        class="layer-del-btn"
                                        (click)="$event.stopPropagation(); deleteBlock(node.id)"
                                        title="Delete block"
                                    >
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </div>
                            }
                        }
                    </div>
                }
                @if (activeTab() === 'settings') {
                    <div class="panel-section">
                        @if (!store.pageSettings()) {
                            <p class="panel-placeholder">No page loaded.</p>
                        } @else {
                            <!-- General -->
                            <p class="panel-heading">General</p>
                            <div class="sf-group">
                                <label class="sf-label">Page Name</label>
                                <input class="sf-input" type="text"
                                    [value]="store.pageSettings()!.name"
                                    (input)="store.updatePageSettings({ name: $any($event.target).value })" />
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">Slug</label>
                                <div class="sf-slug-row">
                                    <span class="sf-slug-pre">/</span>
                                    <input class="sf-input sf-input--slug" type="text"
                                        [value]="store.pageSettings()!.slug"
                                        (input)="store.updatePageSettings({ slug: $any($event.target).value })" />
                                </div>
                            </div>

                            <!-- Visibility & Status -->
                            <p class="panel-heading sf-section-heading">Visibility & Status</p>
                            <div class="sf-toggle-row">
                                <span class="sf-toggle-label">Active</span>
                                <label class="sf-toggle">
                                    <input type="checkbox" [checked]="store.pageSettings()!.isActive"
                                        (change)="store.updatePageSettings({ isActive: $any($event.target).checked })">
                                    <span class="sf-toggle-track"></span>
                                </label>
                            </div>
                            <div class="sf-toggle-row">
                                <span class="sf-toggle-label">Public</span>
                                <label class="sf-toggle">
                                    <input type="checkbox" [checked]="store.pageSettings()!.isPublic"
                                        (change)="store.updatePageSettings({ isPublic: $any($event.target).checked })">
                                    <span class="sf-toggle-track"></span>
                                </label>
                            </div>
                            <div class="sf-toggle-row">
                                <span class="sf-toggle-label">Requires Auth</span>
                                <label class="sf-toggle">
                                    <input type="checkbox" [checked]="store.pageSettings()!.requiresAuth"
                                        (change)="store.updatePageSettings({ requiresAuth: $any($event.target).checked })">
                                    <span class="sf-toggle-track"></span>
                                </label>
                            </div>

                            <!-- Navigation -->
                            <p class="panel-heading sf-section-heading">Navigation</p>
                            <div class="sf-toggle-row">
                                <span class="sf-toggle-label">Show in Navbar</span>
                                <label class="sf-toggle">
                                    <input type="checkbox" [checked]="store.pageSettings()!.showInNavbar"
                                        (change)="store.updatePageSettings({ showInNavbar: $any($event.target).checked })">
                                    <span class="sf-toggle-track"></span>
                                </label>
                            </div>
                            @if (store.pageSettings()!.showInNavbar) {
                                <div class="sf-group">
                                    <label class="sf-label">Navbar Order</label>
                                    <input class="sf-input sf-input--sm" type="number" min="0"
                                        [value]="store.pageSettings()!.navbarOrder ?? ''"
                                        (input)="store.updatePageSettings({ navbarOrder: toNum($any($event.target).value) })" />
                                </div>
                            }
                            <div class="sf-toggle-row">
                                <span class="sf-toggle-label">Show in Footer</span>
                                <label class="sf-toggle">
                                    <input type="checkbox" [checked]="store.pageSettings()!.showInFooter"
                                        (change)="store.updatePageSettings({ showInFooter: $any($event.target).checked })">
                                    <span class="sf-toggle-track"></span>
                                </label>
                            </div>
                            @if (store.pageSettings()!.showInFooter) {
                                <div class="sf-group">
                                    <label class="sf-label">Footer Order</label>
                                    <input class="sf-input sf-input--sm" type="number" min="0"
                                        [value]="store.pageSettings()!.footerOrder ?? ''"
                                        (input)="store.updatePageSettings({ footerOrder: toNum($any($event.target).value) })" />
                                </div>
                            }

                            <!-- SEO -->
                            <p class="panel-heading sf-section-heading">SEO</p>
                            <div class="sf-group">
                                <label class="sf-label">Page Title</label>
                                <input class="sf-input" type="text"
                                    [value]="store.pageSettings()!.title"
                                    (input)="store.updatePageSettings({ title: $any($event.target).value })" />
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">Description</label>
                                <textarea class="sf-textarea" rows="3"
                                    [value]="store.pageSettings()!.description"
                                    (input)="store.updatePageSettings({ description: $any($event.target).value })"></textarea>
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">Keywords</label>
                                <input class="sf-input" type="text"
                                    [value]="store.pageSettings()!.metaKeywords"
                                    (input)="store.updatePageSettings({ metaKeywords: $any($event.target).value })" />
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">OG Title</label>
                                <input class="sf-input" type="text"
                                    [value]="store.pageSettings()!.metaOgTitle"
                                    (input)="store.updatePageSettings({ metaOgTitle: $any($event.target).value })" />
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">OG Description</label>
                                <textarea class="sf-textarea" rows="2"
                                    [value]="store.pageSettings()!.metaOgDescription"
                                    (input)="store.updatePageSettings({ metaOgDescription: $any($event.target).value })"></textarea>
                            </div>
                            <div class="sf-group">
                                <label class="sf-label">OG Image URL</label>
                                <input class="sf-input" type="text"
                                    [value]="store.pageSettings()!.metaOgImage"
                                    (input)="store.updatePageSettings({ metaOgImage: $any($event.target).value })" />
                            </div>
                            <div class="sf-save-hint">
                                <i class="pi pi-info-circle"></i> Changes are saved when you click Save
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
            }

            .left-panel {
                display: flex;
                height: 100%;
                background: white;
                border-right: 1px solid #e5e7eb;
            }

            /* Icon strip */
            .icon-strip {
                width: 48px;
                flex-shrink: 0;
                border-right: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 8px;
                gap: 4px;
            }

            .icon-btn {
                width: 36px;
                height: 36px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
            }

            .icon-btn:hover {
                background: #f3f4f6;
                color: #111827;
            }

            .icon-btn.active {
                background: #eff6ff;
                color: #2563eb;
            }

            /* Panel content */
            .panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 12px 8px;
                min-width: 0;
            }

            .panel-section {
                padding: 4px 0;
            }

            .panel-heading {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #6b7280;
                padding: 0 4px 8px;
                margin: 0;
            }

            .panel-placeholder {
                font-size: 13px;
                color: #9ca3af;
                text-align: center;
                margin-top: 20px;
            }

            /* Search */
            .search-input {
                width: 100%;
                padding: 6px 10px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 13px;
                margin-bottom: 12px;
                outline: none;
                box-sizing: border-box;
            }

            .search-input:focus {
                border-color: #2563eb;
            }

            /* Category group */
            .cat-group {
                margin-bottom: 16px;
            }

            /* Widget grid */
            .widget-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }

            .widget-tile {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: 10px 4px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: #fafafa;
                cursor: grab;
                font-size: 11px;
                color: #374151;
                transition: background 0.15s, border-color 0.15s;
                overflow: hidden;
            }

            .widget-tile:hover {
                background: #eff6ff;
                border-color: #93c5fd;
                color: #1d4ed8;
            }

            .widget-tile:active {
                cursor: grabbing;
            }

            .widget-tile__icon {
                font-size: 18px;
                flex-shrink: 0;
            }

            .widget-tile__label {
                text-align: center;
                line-height: 1.3;
                word-break: break-word;
                max-width: 80px;
            }

            /* Layers */
            .layer-section {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 5px 4px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                color: #1f2937;
                white-space: nowrap;
                overflow: hidden;
                margin-top: 4px;
                background: #f9fafb;
            }

            .layer-section:hover {
                background: #f3f4f6;
            }

            .layer-section.selected {
                background: #eff6ff;
                color: #2563eb;
            }

            .layer-collapse-btn {
                width: 18px;
                height: 18px;
                border: none;
                background: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #9ca3af;
                flex-shrink: 0;
                border-radius: 3px;
                padding: 0;
            }

            .layer-collapse-btn:hover {
                background: #e5e7eb;
                color: #374151;
            }

            .layer-count {
                font-size: 10px;
                color: #9ca3af;
                background: #e5e7eb;
                border-radius: 10px;
                padding: 1px 6px;
                margin-left: auto;
                flex-shrink: 0;
            }

            .layer-del-btn {
                width: 18px;
                height: 18px;
                border: none;
                background: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #d1d5db;
                flex-shrink: 0;
                border-radius: 3px;
                padding: 0;
                opacity: 0;
                transition: opacity 0.1s;
            }

            .layer-section:hover .layer-del-btn,
            .layer-section.selected .layer-del-btn,
            .layer-item:hover .layer-del-btn,
            .layer-item.selected .layer-del-btn {
                opacity: 1;
            }

            .layer-del-btn:hover {
                background: #fee2e2;
                color: #dc2626;
            }

            .layer-item {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 5px 4px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                color: #374151;
                white-space: nowrap;
                overflow: hidden;
            }

            .layer-item:hover {
                background: #f9fafb;
            }

            .layer-item.selected {
                background: #eff6ff;
                color: #2563eb;
            }

            .layer-icon {
                font-size: 12px;
                flex-shrink: 0;
                color: currentColor;
            }

            .layer-label {
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
            }

            /* ── Settings form ────────────────────────────────────── */

            .sf-section-heading {
                margin-top: 16px;
            }

            .sf-group {
                margin-bottom: 12px;
            }

            .sf-label {
                display: block;
                font-size: 11px;
                font-weight: 500;
                color: #6b7280;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            .sf-input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                font-size: 13px;
                outline: none;
                box-sizing: border-box;
                color: #111827;
                background: white;
            }

            .sf-input:focus {
                border-color: #2563eb;
            }

            .sf-input--sm {
                width: 80px;
            }

            .sf-input--slug {
                flex: 1;
                border-left: none;
                border-radius: 0 5px 5px 0;
            }

            .sf-slug-row {
                display: flex;
                align-items: center;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                overflow: hidden;
            }

            .sf-slug-pre {
                padding: 6px 8px;
                background: #f9fafb;
                color: #9ca3af;
                font-size: 13px;
                border-right: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .sf-textarea {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                font-size: 13px;
                outline: none;
                box-sizing: border-box;
                color: #111827;
                resize: vertical;
                font-family: inherit;
                background: white;
            }

            .sf-textarea:focus {
                border-color: #2563eb;
            }

            .sf-toggle-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 5px 0;
                margin-bottom: 2px;
            }

            .sf-toggle-label {
                font-size: 13px;
                color: #374151;
            }

            .sf-toggle {
                position: relative;
                width: 34px;
                height: 18px;
                cursor: pointer;
                display: inline-block;
                flex-shrink: 0;
            }

            .sf-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }

            .sf-toggle-track {
                position: absolute;
                inset: 0;
                background: #d1d5db;
                border-radius: 999px;
                transition: background 0.2s;
            }

            .sf-toggle-track::after {
                content: '';
                position: absolute;
                left: 2px;
                top: 2px;
                width: 14px;
                height: 14px;
                background: white;
                border-radius: 50%;
                transition: transform 0.2s;
            }

            .sf-toggle input:checked + .sf-toggle-track {
                background: #2563eb;
            }

            .sf-toggle input:checked + .sf-toggle-track::after {
                transform: translateX(16px);
            }

            .sf-save-hint {
                font-size: 11px;
                color: #9ca3af;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 12px 4px 4px;
            }
        `
    ]
})
export class LeftPanelComponent {
    readonly store = inject(PageDocumentStore);
    readonly activeTab = signal<PanelTab>('blocks');
    searchQuery = '';

    private readonly allCategories = categorise(WIDGET_TYPES);

    readonly collapsedSections = signal<Set<string>>(new Set());

    readonly filteredCategories = computed(() => {
        const q = this.searchQuery.toLowerCase().trim();
        if (!q) return this.allCategories;
        return this.allCategories
            .map((cat) => ({
                ...cat,
                widgets: cat.widgets.filter((w) => w.name.includes(q) || this.widgetLabel(w.name).toLowerCase().includes(q))
            }))
            .filter((cat) => cat.widgets.length > 0);
    });

    readonly layerNodes = computed<LayerNode[]>(() => {
        const doc = this.store.document();
        if (!doc) return [];
        const collapsed = this.collapsedSections();
        const nodes: LayerNode[] = [];
        doc.sections.forEach((section, si) => {
            const blockCount = section.columns.reduce((sum, col) => sum + col.blocks.length, 0);
            nodes.push({ kind: 'section', id: section.id, label: `Section ${si + 1}`, depth: 0, blockCount, collapsed: collapsed.has(section.id) });
            if (!collapsed.has(section.id)) {
                for (const col of section.columns) {
                    for (const block of col.blocks) {
                        nodes.push({ kind: 'block', id: block.id, label: block.type, depth: 1 });
                    }
                }
            }
        });
        return nodes;
    });

    setTab(tab: PanelTab): void {
        this.activeTab.set(tab);
    }

    widgetLabel(name: string): string {
        return name
            .replace(/^ngo-/, 'NGO ')
            .split('-')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');
    }

    onDragStart(event: DragEvent, w: WidgetType): void {
        event.dataTransfer?.setData('widgetType', w.name);
    }

    toggleCollapse(sectionId: string): void {
        this.collapsedSections.update((set) => {
            const next = new Set(set);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    }

    deleteSection(sectionId: string): void {
        this.store.dispatch(new DeleteSectionCommand(sectionId));
        if (this.store.selectedId() === sectionId) this.store.selectElement(null);
    }

    deleteBlock(blockId: string): void {
        this.store.dispatch(new DeleteBlockCommand(blockId));
        if (this.store.selectedId() === blockId) this.store.selectElement(null);
    }

    toNum(val: string): number | null {
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    }

    addWidget(w: WidgetType): void {
        const doc = this.store.document();
        if (!doc) return;

        // Find target column: selected column, or first column in document
        const targetColumnId = this.resolveTargetColumnId(doc);
        if (!targetColumnId) {
            // No columns yet — create a new section first
            this.addNewSection(w);
            return;
        }

        const block: BlockNode = {
            id: this.makeId(),
            type: w.name,
            settings: structuredClone(w.defaultConfig ?? {})
        };
        this.store.dispatch(new AddBlockCommand(targetColumnId, block));
        this.store.selectElement(block.id);
    }

    private resolveTargetColumnId(doc: typeof this.store.document extends () => infer T ? T : never): string | null {
        // Prefer currently selected block's column
        const selId = this.store.selectedId();
        if (selId) {
            for (const section of (doc as any).sections) {
                for (const col of section.columns) {
                    if (col.blocks.some((b: any) => b.id === selId)) return col.id;
                }
            }
        }
        // Fall back to first column in document
        return (doc as any).sections?.[0]?.columns?.[0]?.id ?? null;
    }

    private addNewSection(w: WidgetType): void {
        const colId = this.makeId();
        const block: BlockNode = {
            id: this.makeId(),
            type: w.name,
            settings: structuredClone(w.defaultConfig ?? {})
        };
        const column: ColumnNode = { id: colId, widthFraction: 1, blocks: [block] };
        const section: SectionNode = {
            id: this.makeId(),
            settings: { fullWidth: true } as any,
            columns: [column]
        };
        this.store.dispatch(new AddSectionCommand(section));
        this.store.selectElement(block.id);
    }

    private makeId(): string {
        if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
            return (crypto as any).randomUUID() as string;
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
    }
}
