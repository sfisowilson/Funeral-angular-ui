import { BlockNode, BlockStyles, ColumnNode, PageDocument, SectionNode, VisibilityConfig } from '../document.model';
import { EditorCommand } from './editor-command.interface';

// ─────────────────────────────────────────────────────────────
// Utility helpers (pure, no exports)
// ─────────────────────────────────────────────────────────────

function cloneDoc(doc: PageDocument): PageDocument {
    return structuredClone(doc);
}

interface BlockLocation {
    block: BlockNode;
    column: ColumnNode;
    section: SectionNode;
    parentBlock: BlockNode | null;
    index: number;
}

function findBlock(doc: PageDocument, blockId: string): BlockLocation | null {
    for (const section of doc.sections) {
        for (const column of section.columns) {
            for (let index = 0; index < column.blocks.length; index++) {
                const found = findBlockInTree(column.blocks[index], blockId, column, section, null, index);
                if (found) return found;
            }
        }
    }
    return null;
}

function findBlockInTree(
    block: BlockNode,
    blockId: string,
    column: ColumnNode,
    section: SectionNode,
    parentBlock: BlockNode | null,
    index: number
): BlockLocation | null {
    if (block.id === blockId) {
        return { block, column, section, parentBlock, index };
    }

    for (let childIndex = 0; childIndex < (block.children?.length ?? 0); childIndex++) {
        const child = block.children![childIndex];
        const found = findBlockInTree(child, blockId, column, section, block, childIndex);
        if (found) return found;
    }

    return null;
}

function findColumn(doc: PageDocument, columnId: string): { column: ColumnNode; section: SectionNode } | null {
    for (const section of doc.sections) {
        const column = section.columns.find((c) => c.id === columnId);
        if (column) return { column, section };
    }
    return null;
}

function makeId(): string {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID() as string;
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

function now(): number {
    return Date.now();
}

// ─────────────────────────────────────────────────────────────
// AddBlock
// ─────────────────────────────────────────────────────────────

export class AddBlockCommand implements EditorCommand {
    readonly type = 'add-block';
    readonly id: string;
    readonly timestamp: number;
    readonly label: string;

    constructor(
        private readonly columnId: string,
        private readonly block: BlockNode,
        private readonly insertAtIndex?: number
    ) {
        this.id = makeId();
        this.timestamp = now();
        this.label = `Add ${block.type}`;
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findColumn(d, this.columnId);
        if (!result) return d;
        const { column } = result;
        const idx = this.insertAtIndex ?? column.blocks.length;
        column.blocks.splice(idx, 0, structuredClone(this.block));
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findColumn(d, this.columnId);
        if (!result) return d;
        result.column.blocks = result.column.blocks.filter((b) => b.id !== this.block.id);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// DeleteBlock
// ─────────────────────────────────────────────────────────────

export class DeleteBlockCommand implements EditorCommand {
    readonly type = 'delete-block';
    readonly id: string;
    readonly timestamp: number;
    readonly label: string;

    private savedBlock: BlockNode | null = null;
    private savedColumnId: string | null = null;
    private savedParentBlockId: string | null = null;
    private savedIndex: number = 0;

    constructor(private readonly blockId: string) {
        this.id = makeId();
        this.timestamp = now();
        this.label = 'Delete block';
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const location = findBlock(d, this.blockId);
        if (!location) return d;

        this.savedBlock = structuredClone(location.block);
        this.savedColumnId = location.column.id;
        this.savedParentBlockId = location.parentBlock?.id ?? null;
        this.savedIndex = location.index;

        if (location.parentBlock) {
            location.parentBlock.children?.splice(location.index, 1);
        } else {
            location.column.blocks.splice(location.index, 1);
        }

        return d;
    }

    undo(doc: PageDocument): PageDocument {
        if (!this.savedBlock || !this.savedColumnId) return doc;
        const d = cloneDoc(doc);
        if (this.savedParentBlockId) {
            const parentLocation = findBlock(d, this.savedParentBlockId);
            if (!parentLocation) return d;
            const children = parentLocation.block.children ?? (parentLocation.block.children = []);
            children.splice(this.savedIndex, 0, structuredClone(this.savedBlock));
            return d;
        }

        const result = findColumn(d, this.savedColumnId);
        if (!result) return d;
        result.column.blocks.splice(this.savedIndex, 0, structuredClone(this.savedBlock));
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// MoveBlock
// ─────────────────────────────────────────────────────────────

export interface MoveBlockParams {
    blockId: string;
    fromColumnId: string;
    fromIndex: number;
    toColumnId: string;
    toIndex: number;
}

export class MoveBlockCommand implements EditorCommand {
    readonly type = 'move-block';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Move block';

    constructor(private readonly params: MoveBlockParams) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const fromCol = findColumn(d, this.params.fromColumnId);
        if (!fromCol) return d;
        const [block] = fromCol.column.blocks.splice(this.params.fromIndex, 1);
        if (!block) return d;
        const toCol = findColumn(d, this.params.toColumnId);
        if (!toCol) {
            fromdCol_restore(fromCol.column, block, this.params.fromIndex);
            return d;
        }
        toCol.column.blocks.splice(this.params.toIndex, 0, block);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        // Reverse: move from toColumnId back to fromColumnId
        const reversed: MoveBlockParams = {
            blockId: this.params.blockId,
            fromColumnId: this.params.toColumnId,
            fromIndex: this.params.toIndex,
            toColumnId: this.params.fromColumnId,
            toIndex: this.params.fromIndex
        };
        return new MoveBlockCommand(reversed).execute(doc);
    }
}

function fromdCol_restore(col: ColumnNode, block: BlockNode, idx: number): void {
    col.blocks.splice(idx, 0, block);
}

// ─────────────────────────────────────────────────────────────
// UpdateBlockSettings
// ─────────────────────────────────────────────────────────────

export class UpdateBlockSettingsCommand implements EditorCommand {
    readonly type = 'update-block-settings';
    readonly id: string;
    readonly timestamp: number;
    readonly label: string;

    constructor(
        readonly blockId: string,
        private readonly newSettings: Record<string, unknown>,
        private readonly previousSettings: Record<string, unknown>
    ) {
        this.id = makeId();
        this.timestamp = now();
        this.label = 'Update block settings';
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.settings = structuredClone(this.newSettings);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.settings = structuredClone(this.previousSettings);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// UpdateBlockStyles
// ─────────────────────────────────────────────────────────────

export class UpdateBlockStylesCommand implements EditorCommand {
    readonly type = 'update-block-styles';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Update block styles';

    constructor(
        readonly blockId: string,
        private readonly newStyles: BlockStyles,
        private readonly previousStyles: BlockStyles
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.blockStyles = structuredClone(this.newStyles);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.blockStyles = structuredClone(this.previousStyles);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// UpdateBlockVisibility
// ─────────────────────────────────────────────────────────────

export class UpdateBlockVisibilityCommand implements EditorCommand {
    readonly type = 'update-block-visibility';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Update block visibility';

    constructor(
        readonly blockId: string,
        private readonly newVisibility: VisibilityConfig,
        private readonly previousVisibility: VisibilityConfig
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.visibility = structuredClone(this.newVisibility);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const result = findBlock(d, this.blockId);
        if (!result) return d;
        result.block.visibility = structuredClone(this.previousVisibility);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// AddSection
// ─────────────────────────────────────────────────────────────

export class AddSectionCommand implements EditorCommand {
    readonly type = 'add-section';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Add section';

    constructor(
        private readonly section: SectionNode,
        private readonly insertAtIndex?: number
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const idx = this.insertAtIndex ?? d.sections.length;
        d.sections.splice(idx, 0, structuredClone(this.section));
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        d.sections = d.sections.filter((s) => s.id !== this.section.id);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// DeleteSection
// ─────────────────────────────────────────────────────────────

export class DeleteSectionCommand implements EditorCommand {
    readonly type = 'delete-section';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Delete section';

    private savedSection: SectionNode | null = null;
    private savedIndex: number = 0;

    constructor(private readonly sectionId: string) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const idx = d.sections.findIndex((s) => s.id === this.sectionId);
        if (idx !== -1) {
            this.savedSection = structuredClone(d.sections[idx]);
            this.savedIndex = idx;
            d.sections.splice(idx, 1);
        }
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        if (!this.savedSection) return doc;
        const d = cloneDoc(doc);
        d.sections.splice(this.savedIndex, 0, structuredClone(this.savedSection));
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// MoveSection
// ─────────────────────────────────────────────────────────────

export class MoveSectionCommand implements EditorCommand {
    readonly type = 'move-section';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Move section';

    constructor(
        private readonly sectionId: string,
        private readonly fromIndex: number,
        private readonly toIndex: number
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const idx = d.sections.findIndex((s) => s.id === this.sectionId);
        if (idx === -1) return d;
        const [section] = d.sections.splice(idx, 1);
        d.sections.splice(this.toIndex, 0, section);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        return new MoveSectionCommand(this.sectionId, this.toIndex, this.fromIndex).execute(doc);
    }
}

// ─────────────────────────────────────────────────────────────
// UpdateSectionSettings
// ─────────────────────────────────────────────────────────────

export class UpdateSectionSettingsCommand implements EditorCommand {
    readonly type = 'update-section-settings';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Update section settings';

    constructor(
        private readonly sectionId: string,
        private readonly newSettings: SectionNode['settings'],
        private readonly previousSettings: SectionNode['settings']
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        section.settings = structuredClone(this.newSettings);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        section.settings = structuredClone(this.previousSettings);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// ResizeColumn
// ─────────────────────────────────────────────────────────────

export class ResizeColumnCommand implements EditorCommand {
    readonly type = 'resize-column';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Resize columns';

    constructor(
        private readonly sectionId: string,
        /** New widthFractions array — must sum to 1.0, length must match columns count */
        private readonly newFractions: number[],
        private readonly previousFractions: number[]
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        section.columns.forEach((col, i) => {
            if (this.newFractions[i] !== undefined) {
                col.widthFraction = this.newFractions[i];
            }
        });
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        section.columns.forEach((col, i) => {
            if (this.previousFractions[i] !== undefined) {
                col.widthFraction = this.previousFractions[i];
            }
        });
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// AddColumn
// ─────────────────────────────────────────────────────────────

export class AddColumnCommand implements EditorCommand {
    readonly type = 'add-column';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Add column';

    constructor(
        private readonly sectionId: string,
        private readonly previousFractions: number[]
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        const newCount = section.columns.length + 1;
        const equalFraction = 1 / newCount;
        section.columns.forEach((col) => (col.widthFraction = equalFraction));
        section.columns.push({ id: makeId(), widthFraction: equalFraction, blocks: [] });
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section) return d;
        section.columns.pop();
        section.columns.forEach((col, i) => (col.widthFraction = this.previousFractions[i] ?? col.widthFraction));
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// RemoveColumn
// ─────────────────────────────────────────────────────────────

export class RemoveColumnCommand implements EditorCommand {
    readonly type = 'remove-column';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Remove column';

    private savedColumn: ColumnNode | null = null;
    private savedIndex: number = 0;
    private savedFractions: number[] = [];

    constructor(
        private readonly sectionId: string,
        private readonly columnId: string
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section || section.columns.length <= 1) return d;
        const idx = section.columns.findIndex((c) => c.id === this.columnId);
        if (idx === -1) return d;
        this.savedFractions = section.columns.map((c) => c.widthFraction);
        this.savedColumn = structuredClone(section.columns[idx]);
        this.savedIndex = idx;
        section.columns.splice(idx, 1);
        const equalFraction = 1 / section.columns.length;
        section.columns.forEach((col) => (col.widthFraction = equalFraction));
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        const section = d.sections.find((s) => s.id === this.sectionId);
        if (!section || !this.savedColumn) return d;
        section.columns.splice(this.savedIndex, 0, structuredClone(this.savedColumn));
        section.columns.forEach((col, i) => (col.widthFraction = this.savedFractions[i] ?? col.widthFraction));
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// UpdateGlobalStyles
// ─────────────────────────────────────────────────────────────

export class UpdateGlobalStylesCommand implements EditorCommand {
    readonly type = 'update-global-styles';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Update global styles';

    constructor(
        private readonly newStyles: PageDocument['globalStyles'],
        private readonly previousStyles: PageDocument['globalStyles']
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        d.globalStyles = structuredClone(this.newStyles);
        return d;
    }

    undo(doc: PageDocument): PageDocument {
        const d = cloneDoc(doc);
        d.globalStyles = structuredClone(this.previousStyles);
        return d;
    }
}

// ─────────────────────────────────────────────────────────────
// SetDocument (load/replace entire document — not undoable)
// ─────────────────────────────────────────────────────────────

export class SetDocumentCommand implements EditorCommand {
    readonly type = 'set-document';
    readonly id: string;
    readonly timestamp: number;
    readonly label = 'Load document';

    constructor(private readonly document: PageDocument) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(_doc: PageDocument): PageDocument {
        return structuredClone(this.document);
    }

    undo(doc: PageDocument): PageDocument {
        // SetDocument is not undoable (it is the initial load).
        return doc;
    }
}

// ─────────────────────────────────────────────────────────────
// BatchCommand — groups multiple commands into one undo step
// ─────────────────────────────────────────────────────────────

export class BatchCommand implements EditorCommand {
    readonly type = 'batch';
    readonly id: string;
    readonly timestamp: number;

    constructor(
        readonly label: string,
        private readonly commands: EditorCommand[]
    ) {
        this.id = makeId();
        this.timestamp = now();
    }

    execute(doc: PageDocument): PageDocument {
        return this.commands.reduce((acc, cmd) => cmd.execute(acc), doc);
    }

    undo(doc: PageDocument): PageDocument {
        // Undo in reverse order
        return [...this.commands].reverse().reduce((acc, cmd) => cmd.undo(acc), doc);
    }
}
