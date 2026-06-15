import { Component, effect, inject, Type } from '@angular/core';
import { CommonModule, DOCUMENT, NgComponentOutlet } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PageDocumentStore } from '../core/page-document.store';
import { BlockNode, BlockStyles, Breakpoint, ColumnNode, SectionNode, SectionSettings } from '../core/document.model';
import { WIDGET_TYPES } from '../../building-blocks/widget-registry';
import { DeleteBlockCommand, DeleteSectionCommand, MoveSectionCommand, MoveBlockCommand, AddBlockCommand, AddColumnCommand, RemoveColumnCommand, AddSectionCommand } from '../core/commands/commands';
import { BlockAttrsDirective } from './block-attrs.directive';
import { buildRenderableWidgetConfig, getBackgroundCss, getBlockWrapperRenderStyles, getSectionRenderStyles, isBlockHiddenForBreakpoint } from '../core/render/block-render.util';

// Resolve widget render component from registry
function getWidgetComponent(type: string): Type<any> | null {
    return WIDGET_TYPES.find((w) => w.name === type)?.component ?? null;
}

@Component({
    selector: 'app-builder-canvas-area',
    standalone: true,
    imports: [CommonModule, NgComponentOutlet, DragDropModule, BlockAttrsDirective],
    template: `
        <div class="canvas-area">
            <!-- Canvas viewport -->
            <div class="canvas-viewport" (click)="onViewportClick($event)">
                <div class="canvas-frame" [class]="'canvas-frame--' + store.activeBreakpoint()">
                    @if (!store.document() || (store.document()?.sections?.length ?? 0) === 0) {
                        <div class="canvas-empty">
                            <div class="canvas-empty-icon">
                                <i class="pi pi-plus-circle"></i>
                            </div>
                            <h3>Start building your page</h3>
                            <p>Drag a block from the left panel, or click <strong>Add Section</strong> below to get started.</p>
                            <button class="canvas-empty-btn" (click)="addFirstSection()">
                                <i class="pi pi-plus"></i> Add Section
                            </button>
                        </div>
                    }

                    @for (section of store.document()?.sections ?? []; track section.id; let si = $index; let sCount = $count) {
                        <div
                            class="canvas-section"
                            [class.canvas-section--selected]="store.selectedId() === section.id"
                            [class.canvas-section--hovered]="store.hoveredId() === section.id"
                            [id]="section.settings.anchorId || null"
                            [ngClass]="section.settings.cssClass || null"
                            [ngStyle]="getSectionStyles(section.settings)"
                            (click)="onSectionClick($event, section.id)"
                        >
                            @if (!store.previewMode()) {
                                <div class="section-chrome">
                                    <span class="section-badge" (click)="selectSectionFromChrome($event, section.id, 'badge')">Section {{ si + 1 }}</span>
                                    <div class="section-actions">
                                        <button class="chrome-btn" [disabled]="si === 0" (click)="moveSectionUp(section.id, si)" title="Move up"><i class="pi pi-chevron-up"></i></button>
                                        <button class="chrome-btn" [disabled]="si === sCount - 1" (click)="moveSectionDown(section.id, si, sCount)" title="Move down"><i class="pi pi-chevron-down"></i></button>
                                        <button class="chrome-btn chrome-btn--add" (click)="addColumn(section.id, section)" title="Add column"><i class="pi pi-plus"></i></button>
                                        <button class="chrome-btn chrome-btn--danger" (click)="deleteSection(section.id)" title="Delete section"><i class="pi pi-trash"></i></button>
                                    </div>
                                </div>
                            }

                            <div class="section-columns">
                                @for (column of section.columns; track column.id) {
                                    <div
                                        class="section-column"
                                        [style.flex]="column.widthFraction"
                                        cdkDropList
                                        [cdkDropListData]="column"
                                        [cdkDropListConnectedTo]="getColumnDropListIds(section.id)"
                                        [id]="column.id"
                                        (cdkDropListDropped)="onBlockDrop($event)"
                                        (dragover)="onColumnDragOver($event)"
                                        (drop)="onLibraryDrop($event, column)"
                                    >
                                        @if (!store.previewMode() && section.columns.length > 1) {
                                            <div class="column-header">
                                                <span>{{ (column.widthFraction * 100).toFixed(0) }}%</span>
                                                <button class="chrome-btn chrome-btn--sm" (click)="$event.stopPropagation(); removeColumn(section.id, column.id)" title="Remove column"><i class="pi pi-times"></i></button>
                                            </div>
                                        }
                                        @for (block of column.blocks; track block.id) {
                                            <div
                                                class="block-wrapper"
                                                [class.block-wrapper--selected]="store.selectedId() === block.id"
                                                [class.block-wrapper--hovered]="store.hoveredId() === block.id"
                                                [class.block-wrapper--preview]="store.previewMode()"
                                                [id]="'block-' + block.id"
                                                [ngClass]="block.blockStyles?.cssClass || null"
                                                [ngStyle]="getBlockWrapperStyles(block)"
                                                [appBlockAttrs]="block.blockStyles?.htmlAttributes"
                                                cdkDrag
                                                [cdkDragDisabled]="store.previewMode()"
                                                (click)="onBlockClick($event, block.id)"
                                                (mouseenter)="!store.previewMode() && store.hoveredId.set(block.id)"
                                                (mouseleave)="store.hoveredId.set(null)"
                                            >
                                                @if (!store.previewMode()) {
                                                    <div class="block-chrome">
                                                        <span class="block-type-label">{{ block.type }}</span>
                                                        <div class="block-actions">
                                                            <span class="block-drag-handle" cdkDragHandle title="Drag to reorder"><i class="pi pi-bars"></i></span>
                                                            <button class="chrome-btn chrome-btn--sm chrome-btn--danger" (click)="$event.stopPropagation(); deleteBlock(block.id)" title="Delete"><i class="pi pi-trash"></i></button>
                                                        </div>
                                                    </div>
                                                }
                                                @if (resolveComponent(block); as cmp) {
                                                    <ng-container
                                                        [ngComponentOutlet]="cmp"
                                                        [ngComponentOutletInputs]="{ config: getWidgetConfig(block) }"
                                                    />
                                                } @else {
                                                    <div class="block-unknown">Unknown block: {{ block.type }}</div>
                                                }
                                                <!-- CDK drag placeholder -->
                                                <div *cdkDragPlaceholder class="block-drag-placeholder"></div>
                                            </div>
                                        }

                                        @if (column.blocks.length === 0) {
                                            <div
                                                class="column-empty"
                                                (dragover)="onColumnDragOver($event)"
                                                (drop)="onLibraryDrop($event, column)"
                                            >Drop blocks here</div>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
                background: #f0f2f5;
            }

            .canvas-area {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
            }

            /* Viewport */
            .canvas-viewport {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                padding: 24px;
                display: flex;
                justify-content: center;
                align-items: flex-start;
            }

            .canvas-frame {
                background: white;
                min-height: 600px;
                width: 100%;
                max-width: 1200px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.08);
                border-radius: 4px;
                transition: max-width 0.2s ease;
                position: relative;
            }

            .canvas-frame--tablet {
                max-width: 768px;
            }

            .canvas-frame--mobile {
                max-width: 375px;
            }

            /* Empty state */
            .canvas-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 400px;
                gap: 8px;
                color: #9ca3af;
            }

            .canvas-empty p {
                margin: 0;
                font-size: 14px;
            }

            .canvas-empty-hint {
                font-size: 12px !important;
                color: #d1d5db !important;
            }

            /* Sections */
            .canvas-section {
                position: relative;
                border: 2px solid transparent;
                transition: border-color 0.1s;
                min-height: 60px;
                cursor: default;
            }

            .canvas-section:hover {
                border-color: #bfdbfe;
            }

            .canvas-section--selected {
                border-color: #2563eb !important;
            }

            .section-badge {
                position: absolute;
                top: -1px;
                left: 0;
                font-size: 10px;
                background: #e0e7ff;
                color: #3730a3;
                padding: 2px 6px;
                border-radius: 0 0 4px 0;
                opacity: 0;
                transition: opacity 0.1s;
                z-index: 1;
                border: none;
                cursor: pointer;
            }

            .canvas-section:hover .section-badge,
            .canvas-section--selected .section-badge {
                opacity: 1;
            }

            /* Section action bar */
            .section-chrome, .section-actions {
                position: absolute;
                top: 4px;
                right: 4px;
                display: flex;
                gap: 2px;
                opacity: 0;
                transition: opacity 0.12s;
                z-index: 10;
            }

            .canvas-section:hover .section-actions,
            .canvas-section--selected .section-actions {
                opacity: 1;
            }

            .section-action-btn {
                width: 26px;
                height: 26px;
                border: none;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: #6b7280;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                transition: background 0.1s, color 0.1s;
            }

            .section-action-btn--primary {
                background: #eff6ff;
                color: #2563eb;
                border-color: #bfdbfe;
            }

            .section-action-btn:hover:not(:disabled) {
                background: #f3f4f6;
                color: #111827;
            }

            .section-action-btn--danger:hover:not(:disabled) {
                background: #fee2e2;
                color: #dc2626;
                border-color: #fca5a5;
            }

            .section-action-btn:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }

            .section-columns {
                display: flex;
                width: 100%;
            }

            .section-column {
                padding: 8px;
                border-right: 1px dashed #e5e7eb;
                min-height: 60px;
                min-width: 0;
                overflow: hidden;
            }

            .section-column:last-child {
                border-right: none;
            }

            /* Blocks */
            .block-wrapper {
                border: 2px solid transparent;
                border-radius: 4px;
                margin-bottom: 4px;
                cursor: pointer;
                background: #f9fafb;
                transition: border-color 0.1s;
                min-height: 40px;
                position: relative;
            }

            .block-wrapper:hover,
            .block-wrapper--hovered {
                border-color: #93c5fd;
            }

            .block-wrapper--selected {
                border-color: #2563eb !important;
                background: #eff6ff;
            }

            .block-wrapper--preview {
                border-color: transparent !important;
                background: transparent;
                margin-bottom: 0;
                cursor: default !important;
            }

            /* Block header row */
            .block-header, .block-chrome {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 6px;
                border-bottom: 1px solid #e5e7eb;
                background: #f3f4f6;
                border-radius: 2px 2px 0 0;
            }

            .block-type-label {
                font-size: 11px;
                font-family: monospace;
                color: #6b7280;
            }

            .block-actions {
                display: flex;
                gap: 2px;
                opacity: 0;
                transition: opacity 0.1s;
            }

            .block-wrapper:hover .block-actions,
            .block-wrapper--selected .block-actions {
                opacity: 1;
            }

            .block-action-btn, .chrome-btn {
                width: 22px;
                height: 22px;
                border: none;
                background: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                color: #9ca3af;
                border-radius: 3px;
                transition: background 0.1s, color 0.1s;
            }

            .block-action-btn:hover, .chrome-btn:hover {
                background: #e5e7eb;
                color: #374151;
            }

            .block-action-btn--danger:hover {
                background: #fee2e2;
                color: #dc2626;
            }

            .block-drag-handle {
                cursor: grab;
            }

            .block-drag-handle:active {
                cursor: grabbing;
            }

            /* CDK drag states */
            .cdk-drag-preview {
                background: white;
                border: 2px solid #2563eb;
                border-radius: 4px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.16);
                opacity: 0.9;
            }

            .cdk-drag-animating {
                transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
            }

            .block-drag-placeholder {
                background: #dbeafe;
                border: 2px dashed #93c5fd;
                border-radius: 4px;
                min-height: 48px;
                margin-bottom: 4px;
            }

            .block-unknown {
                font-size: 12px;
                color: #ef4444;
                padding: 8px;
                text-align: center;
                border: 1px dashed #fca5a5;
                border-radius: 4px;
            }

            /* Section action divider */
            .section-action-divider {
                width: 1px;
                height: 16px;
                background: #e5e7eb;
                margin: 0 2px;
            }

            /* Column header bar */
            .column-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 2px 6px;
                background: #f3f4f6;
                border-bottom: 1px solid #e5e7eb;
                border-radius: 2px 2px 0 0;
                min-height: 22px;
            }

            .col-width-label {
                font-size: 10px;
                color: #9ca3af;
                font-family: monospace;
            }

            .col-remove-btn, .chrome-btn--sm {
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
                border-radius: 3px;
                padding: 0;
                transition: background 0.1s, color 0.1s;
            }

            .col-remove-btn:hover {
                background: #fee2e2;
                color: #dc2626;
            }

            /* Column dragover highlight */
            .section-column.drag-over {
                background: #eff6ff;
                border-color: #93c5fd;
            }

            /* Empty column drop zone */
            .column-empty {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 48px;
                border: 2px dashed #e5e7eb;
                border-radius: 4px;
                font-size: 12px;
                color: #d1d5db;
            }

            /* CDK drop list active/over states */
            .cdk-drop-list-dragging .block-wrapper:not(.cdk-drag-placeholder) {
                transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
            }

            .cdk-drop-list-receiving {
                border: 2px dashed #93c5fd;
                border-radius: 4px;
                background: #eff6ff;
            }
        `
    ]
})
export class CanvasAreaComponent {
    readonly store = inject(PageDocumentStore);
    private readonly cssDocument = inject(DOCUMENT);
    private readonly styleTagMap = new Map<string, HTMLStyleElement>();

    constructor() {
        // Keep custom CSS style tags in sync with document blocks
        effect(() => {
            const doc = this.store.document();
            if (!doc) return;
            const activeIds = new Set<string>();
            for (const section of doc.sections) {
                for (const column of section.columns) {
                    for (const block of column.blocks) {
                        activeIds.add(block.id);
                        this.syncBlockCustomCss(block.id, block.blockStyles?.customCss, block.blockStyles);
                    }
                }
            }
            // Remove orphaned style tags
            for (const blockId of this.styleTagMap.keys()) {
                if (!activeIds.has(blockId)) this.syncBlockCustomCss(blockId, undefined);
            }
        });
    }

    private syncBlockCustomCss(blockId: string, customCss?: string | null, bs?: BlockStyles | null): void {
        const styleId = `block-css-${blockId}`;
        // Build combined CSS: custom CSS + hover rules from blockStyles
        const parts: string[] = [];
        if (customCss?.trim()) {
            parts.push(customCss.replace(/&/g, `#block-${blockId}`));
        }
        if (bs) {
            const hoverRules: string[] = [];
            if (bs.hoverBackground) {
                const hoverBg = getBackgroundCss(bs.hoverBackground);
                for (const [prop, val] of Object.entries(hoverBg)) {
                    hoverRules.push(`${prop}:${val}`);
                }
            }
            if (bs.hoverBorderColor) hoverRules.push(`border-color:${bs.hoverBorderColor}`);
            if (bs.hoverBoxShadow) hoverRules.push(`box-shadow:${bs.hoverBoxShadow}`);
            if (hoverRules.length) {
                parts.push(`#block-${blockId}:hover{${hoverRules.join(';')}}`);
            }
        }
        const combined = parts.join('\n');
        if (!combined) {
            this.cssDocument.getElementById(styleId)?.remove();
            this.styleTagMap.delete(blockId);
            return;
        }
        let styleEl = this.cssDocument.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = this.cssDocument.createElement('style') as HTMLStyleElement;
            styleEl.id = styleId;
            this.cssDocument.head.appendChild(styleEl);
            this.styleTagMap.set(blockId, styleEl);
        }
        styleEl.textContent = combined;
    }

    // ── Style helpers ─────────────────────────────────────────

    getSectionStyles(settings: SectionSettings): Record<string, string> {
        return getSectionRenderStyles(settings);
    }

    getBlockWrapperStyles(block: BlockNode): Record<string, string> {
        return getBlockWrapperRenderStyles(block, this.store.activeBreakpoint());
    }

    isBlockHidden(block: BlockNode): boolean {
        return isBlockHiddenForBreakpoint(block.visibility, this.store.activeBreakpoint());
    }

    getWidgetConfig(block: BlockNode) {
        return buildRenderableWidgetConfig(block);
    }

    resolveComponent(block: BlockNode): Type<any> | null {
        return getWidgetComponent(block.type);
    }

    setBreakpoint(bp: Breakpoint): void {
        this.store.activeBreakpoint.set(bp);
    }

    togglePreview(): void {
        this.store.previewMode.update((v) => !v);
    }

    onBlockClick(event: MouseEvent, blockId: string): void {
        if (this.store.previewMode()) return;
        event.stopPropagation();
        this.store.selectElement(blockId);
    }

    onSectionClick(event: MouseEvent, sectionId: string): void {
        if (this.store.previewMode()) return;
        event.stopPropagation();
        this.store.selectElement(sectionId);
    }

    selectSectionFromChrome(event: MouseEvent, sectionId: string, _source: 'badge' | 'toolbar'): void {
        if (this.store.previewMode()) return;
        event.stopPropagation();
        this.store.selectElement(sectionId);
    }

    onViewportClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('canvas-viewport')) {
            this.store.selectElement(null);
        }
    }

    // ── Section controls ──────────────────────────────────────

    addFirstSection(): void {
        const sectionId = this.makeId();
        const columnId = this.makeId();
        const section: SectionNode = {
            id: sectionId,
            settings: { fullWidth: true } as any,
            columns: [{ id: columnId, widthFraction: 1, blocks: [] }]
        };
        this.store.dispatch(new AddSectionCommand(section));
    }

    deleteSection(sectionId: string): void {
        this.store.dispatch(new DeleteSectionCommand(sectionId));
        if (this.store.selectedId() === sectionId) {
            this.store.selectElement(null);
        }
    }

    moveSectionUp(sectionId: string, currentIndex: number): void {
        if (currentIndex === 0) return;
        this.store.dispatch(new MoveSectionCommand(sectionId, currentIndex, currentIndex - 1));
    }

    moveSectionDown(sectionId: string, currentIndex: number, total: number): void {
        if (currentIndex >= total - 1) return;
        this.store.dispatch(new MoveSectionCommand(sectionId, currentIndex, currentIndex + 1));
    }

    // ── Block controls ────────────────────────────────────────

    deleteBlock(blockId: string): void {
        this.store.dispatch(new DeleteBlockCommand(blockId));
        if (this.store.selectedId() === blockId) {
            this.store.selectElement(null);
        }
    }

    // ── Column controls ───────────────────────────────────────

    addColumn(sectionId: string, section: { columns: { widthFraction: number }[] }): void {
        const previousFractions = section.columns.map((c) => c.widthFraction);
        this.store.dispatch(new AddColumnCommand(sectionId, previousFractions));
    }

    removeColumn(sectionId: string, columnId: string): void {
        this.store.dispatch(new RemoveColumnCommand(sectionId, columnId));
        if (this.store.selectedId() === columnId) {
            this.store.selectElement(null);
        }
    }

    // ── Drag-from-library ─────────────────────────────────────

    onColumnDragOver(event: DragEvent): void {
        if (event.dataTransfer?.types.includes('widgettype')) {
            event.preventDefault();
        }
    }

    onLibraryDrop(event: DragEvent, column: ColumnNode): void {
        event.preventDefault();
        event.stopPropagation();
        const widgetTypeName = event.dataTransfer?.getData('widgetType');
        if (!widgetTypeName) return;
        const wt = WIDGET_TYPES.find((w) => w.name === widgetTypeName);
        if (!wt) return;
        const block: BlockNode = {
            id: this.makeId(),
            type: wt.name,
            settings: structuredClone(wt.defaultConfig ?? {})
        };
        this.store.dispatch(new AddBlockCommand(column.id, block));
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

    // ── Drag & drop ───────────────────────────────────────────

    /** Returns sibling column ids for cdkDropListConnectedTo */
    getColumnDropListIds(sectionId: string): string[] {
        const doc = this.store.document();
        if (!doc) return [];
        const section = doc.sections.find((s) => s.id === sectionId);
        return section?.columns.map((c) => c.id) ?? [];
    }

    onBlockDrop(event: CdkDragDrop<ColumnNode>): void {
        if (event.previousContainer === event.container) {
            // Same column — reorder
            if (event.previousIndex === event.currentIndex) return;
            const column = event.container.data;
            const block = column.blocks[event.previousIndex];
            this.store.dispatch(
                new MoveBlockCommand({
                    blockId: block.id,
                    fromColumnId: column.id,
                    fromIndex: event.previousIndex,
                    toColumnId: column.id,
                    toIndex: event.currentIndex
                })
            );
        } else {
            // Different column — transfer
            const fromColumn = event.previousContainer.data;
            const toColumn = event.container.data;
            const block = fromColumn.blocks[event.previousIndex];
            this.store.dispatch(
                new MoveBlockCommand({
                    blockId: block.id,
                    fromColumnId: fromColumn.id,
                    fromIndex: event.previousIndex,
                    toColumnId: toColumn.id,
                    toIndex: event.currentIndex
                })
            );
        }
    }
}
