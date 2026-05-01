import { computed, Injectable, signal } from '@angular/core';
import { BlockNode, Breakpoint, DesignTokens, DocumentType, DragState, LeftPanelMode, PageDocument, SectionNode } from './document.model';
import type { EditorCommand } from './commands';
import { HistoryService } from './history.service';

// ─────────────────────────────────────────────────────────────
// Page-level metadata (name, slug, SEO, navigation, etc.)
// Managed separately from the v3 PageDocument — these fields
// live on CustomPageDto, not in the document content.
// ─────────────────────────────────────────────────────────────
export interface PageMetadata {
    name: string;
    slug: string;
    title: string;
    description: string;
    isPublic: boolean;
    requiresAuth: boolean;
    showInNavbar: boolean;
    navbarOrder: number | null;
    showInFooter: boolean;
    footerOrder: number | null;
    isActive: boolean;
    metaKeywords: string;
    metaOgTitle: string;
    metaOgDescription: string;
    metaOgImage: string;
}

/**
 * PageDocumentStore — single injectable signal-based store for all builder state.
 *
 * The store owns the document signal and all UI state signals.
 * All mutations must go through dispatch(command) to keep history in sync.
 * Preview mode and breakpoint switching do NOT go through dispatch (they are
 * non-document UI signals, not undoable).
 */
@Injectable({ providedIn: 'root' })
export class PageDocumentStore {
    constructor(private readonly history: HistoryService) {}

    // ─── Document state ───────────────────────────────────────

    readonly document = signal<PageDocument | null>(null);

    // ─── Selection / hover ────────────────────────────────────

    readonly selectedId = signal<string | null>(null);
    readonly hoveredId = signal<string | null>(null);

    /**
     * When non-null, the canvas shows only the inner template of the
     * container block with this id (query-loop, tabs, accordion).
     */
    readonly innerTemplateBlockId = signal<string | null>(null);

    // ─── Drag state ────────────────────────────────────────────

    readonly dragState = signal<DragState | null>(null);

    // ─── UI state ─────────────────────────────────────────────

    readonly previewMode = signal<boolean>(false);
    readonly activeBreakpoint = signal<Breakpoint>('desktop');
    readonly leftPanelMode = signal<LeftPanelMode>('library');
    readonly documentType = signal<DocumentType>('page');
    readonly sectionEditorTab = signal<'layout' | 'style' | 'advanced'>('layout');

    // ─── Computed derivations ─────────────────────────────────

    readonly isDragging = computed(() => this.dragState() !== null);

    /** The currently selected BlockNode, searched recursively through sections */
    readonly selectedBlock = computed<BlockNode | null>(() => {
        const id = this.selectedId();
        const doc = this.document();
        if (!id || !doc) return null;
        return findBlockById(doc, id);
    });

    /** The currently hovered BlockNode */
    readonly hoveredBlock = computed<BlockNode | null>(() => {
        const id = this.hoveredId();
        const doc = this.document();
        if (!id || !doc) return null;
        return findBlockById(doc, id);
    });

    /** The currently selected SectionNode */
    readonly selectedSection = computed<SectionNode | null>(() => {
        const id = this.selectedId();
        const doc = this.document();
        if (!id || !doc) return null;
        return doc.sections.find((s) => s.id === id) ?? null;
    });

    /** Flat list of all BlockNodes for the Layers panel (includes children) */
    readonly flatBlocks = computed<FlatBlock[]>(() => {
        const doc = this.document();
        if (!doc) return [];
        const result: FlatBlock[] = [];
        doc.sections.forEach((section, si) => {
            section.columns.forEach((col, ci) => {
                col.blocks.forEach((block, bi) => {
                    collectFlatBlocks(result, block, si, ci, bi, 0);
                });
            });
        });
        return result;
    });

    /** Global design tokens from the current document */
    readonly globalStyles = computed<DesignTokens>(() => this.document()?.globalStyles ?? {});

    /** Increments on every dispatch — used by builder shell to detect unsaved changes */
    readonly mutationCount = signal(0);

    /** Page-level metadata (name, slug, SEO fields, navigation flags) */
    readonly pageSettings = signal<PageMetadata | null>(null);

    updatePageSettings(partial: Partial<PageMetadata>): void {
        const current = this.pageSettings();
        if (!current) return;
        this.pageSettings.set({ ...current, ...partial });
    }

    // ─── History state (delegated to HistoryService) ──────────

    readonly canUndo = computed(() => this.history.canUndo());
    readonly canRedo = computed(() => this.history.canRedo());
    readonly undoLabel = computed(() => this.history.undoLabel());
    readonly redoLabel = computed(() => this.history.redoLabel());

    // ─── Dispatch ─────────────────────────────────────────────

    /**
     * Apply a command, update the document signal, and push to history.
     * SetDocument commands clear the history (they are full replacements).
     */
    dispatch(command: EditorCommand): void {
        const current = this.document();
        if (!current && command.type !== 'set-document') return;
        const next = command.execute(current!);
        this.document.set(next);
        this.history.push(command);
        this.mutationCount.update((n) => n + 1);
    }

    // ─── Undo / Redo ──────────────────────────────────────────

    undo(): void {
        const cmd = this.history.popUndo();
        if (!cmd) return;
        const current = this.document();
        if (!current) return;
        const prev = cmd.undo(current);
        this.document.set(prev);
    }

    redo(): void {
        const cmd = this.history.popRedo();
        if (!cmd) return;
        const current = this.document();
        if (!current) return;
        const next = cmd.execute(current);
        this.document.set(next);
    }

    undoToIndex(index: number): void {
        const cmds = this.history.undoToIndex(index);
        const current = this.document();
        if (!current) return;
        const prev = cmds.reduce((acc, cmd) => cmd.undo(acc), current);
        this.document.set(prev);
    }

    // ─── Selection helpers ────────────────────────────────────

    selectElement(id: string | null): void {
        this.selectedId.set(id);
        this.innerTemplateBlockId.set(null); // exit inner template mode on new selection
    }

    enterInnerTemplate(blockId: string): void {
        this.innerTemplateBlockId.set(blockId);
        this.selectedId.set(null);
    }

    exitInnerTemplate(): void {
        this.innerTemplateBlockId.set(null);
    }

    // ─── Document helpers ─────────────────────────────────────

    setDocument(doc: PageDocument): void {
        this.document.set(structuredClone(doc));
        this.history.clear();
        this.selectedId.set(null);
        this.hoveredId.set(null);
        this.innerTemplateBlockId.set(null);
        this.sectionEditorTab.set('layout');
        this.documentType.set(doc.type as DocumentType);
    }
}

// ─────────────────────────────────────────────────────────────
// Internal helper types
// ─────────────────────────────────────────────────────────────

export interface FlatBlock {
    block: BlockNode;
    depth: number;
    sectionIndex: number;
    columnIndex: number;
    blockIndex: number;
    childIndex?: number;
    childPath?: number[];
}

// ─────────────────────────────────────────────────────────────
// Pure recursive search
// ─────────────────────────────────────────────────────────────

function findBlockById(doc: PageDocument, id: string): BlockNode | null {
    for (const section of doc.sections) {
        for (const column of section.columns) {
            for (const block of column.blocks) {
                const found = findBlockInTree(block, id);
                if (found) return found;
            }
        }
    }
    return null;
}

function findSectionById(doc: PageDocument, id: string): SectionNode | null {
    return doc.sections.find((section) => section.id === id) ?? null;
}

function findBlockInTree(block: BlockNode, id: string): BlockNode | null {
    if (block.id === id) return block;
    for (const child of block.children ?? []) {
        const found = findBlockInTree(child, id);
        if (found) return found;
    }
    return null;
}

function collectFlatBlocks(
    result: FlatBlock[],
    block: BlockNode,
    sectionIndex: number,
    columnIndex: number,
    blockIndex: number,
    depth: number,
    childPath: number[] = []
): void {
    result.push({
        block,
        depth,
        sectionIndex,
        columnIndex,
        blockIndex,
        childIndex: childPath.length ? childPath[childPath.length - 1] : undefined,
        childPath: childPath.length ? [...childPath] : undefined
    });

    block.children?.forEach((child, index) => {
        collectFlatBlocks(result, child, sectionIndex, columnIndex, blockIndex, depth + 1, [...childPath, index]);
    });
}
