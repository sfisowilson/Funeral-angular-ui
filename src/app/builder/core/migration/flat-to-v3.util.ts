import { WidgetConfig, WidgetLayoutConfig } from '../../../building-blocks/widget-config';
import { BlockNode, ColumnNode, PageDocument, SectionNode } from '../document.model';

function makeId(): string {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID() as string;
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/**
 * Converts the legacy flat WidgetConfig array (v1 format stored in CustomPages.Content)
 * to the v3 hierarchical PageDocument format.
 *
 * Grouping strategy:
 * - Widgets with the same layout.row are placed in the same section.
 * - Within a section, each widget occupies a column based on layout.column and layout.columnSpan.
 * - widthFraction = columnSpan / 12 (12-column grid).
 * - Widgets with no layout data end up in a single-column section (widthFraction = 1).
 * - Section order follows ascending row number.
 * - Within a section, column order follows ascending column number.
 */
export function flatToV3(widgets: WidgetConfig[], pageId?: string): PageDocument {
    if (!widgets || widgets.length === 0) {
        return emptyDocument(pageId);
    }

    // Group by row number
    const rowMap = new Map<number, WidgetConfig[]>();
    widgets.forEach((w) => {
        const row = w.layout?.row ?? 0;
        if (!rowMap.has(row)) rowMap.set(row, []);
        rowMap.get(row)!.push(w);
    });

    // Sort rows ascending
    const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b);

    const sections: SectionNode[] = sortedRows.map(([_row, rowWidgets]) => {
        // Sort widgets within row by column ascending
        const sorted = [...rowWidgets].sort((a, b) => (a.layout?.column ?? 1) - (b.layout?.column ?? 1));

        // Build columns — one column per widget (each widget in a row is its own column)
        const columns: ColumnNode[] = sorted.map((w) => {
            const layout = w.layout;
            const columnSpan = layout?.columnSpan ?? 12;
            const widthFraction = Math.max(0.01, Math.min(1, columnSpan / 12));

            return {
                id: makeId(),
                widthFraction,
                blocks: [widgetToBlock(w)]
            };
        });

        // Normalize widthFractions so they sum to 1.0
        const total = columns.reduce((sum, c) => sum + c.widthFraction, 0);
        if (total > 0 && Math.abs(total - 1) > 0.01) {
            columns.forEach((c) => (c.widthFraction = c.widthFraction / total));
        }

        return {
            id: makeId(),
            settings: buildSectionSettings(sorted[0]?.layout),
            columns
        };
    });

    return {
        __version: 3,
        type: 'page',
        id: pageId ?? makeId(),
        sections
    };
}

/**
 * Detects whether a parsed content value is already v3 format.
 */
export function isV3Document(content: unknown): content is PageDocument {
    return (
        typeof content === 'object' &&
        content !== null &&
        (content as PageDocument).__version === 3
    );
}

// ─── Internal helpers ────────────────────────────────────────

function emptyDocument(pageId?: string): PageDocument {
    return {
        __version: 3,
        type: 'page',
        id: pageId ?? makeId(),
        sections: []
    };
}

function widgetToBlock(w: WidgetConfig): BlockNode {
    const block: BlockNode = {
        id: w.id,
        type: w.type,
        settings: { ...(w.settings ?? {}) },
        blockStyles: w.blockStyles,
        visibility: w.visibility,
        styleOverrides: w.styleOverrides,
        children: w.children?.map((child) => widgetToBlock(child))
    };

    // Carry over animation settings from layout as styleOverrides
    if (w.layout) {
        const { animationType, animationDuration, animationDelay, animationEnabled, hoverEffect } = w.layout;
        if (animationType || animationDuration || animationDelay != null || animationEnabled != null || hoverEffect) {
            block.settings = {
                ...block.settings,
                animationType: animationType ?? block.settings['animationType'],
                animationDuration: animationDuration ?? block.settings['animationDuration'],
                animationDelay: animationDelay ?? block.settings['animationDelay'],
                animationEnabled: animationEnabled ?? block.settings['animationEnabled'],
                hoverEffect: hoverEffect ?? block.settings['hoverEffect']
            };
        }
    }

    return block;
}

function buildSectionSettings(layout: WidgetLayoutConfig | undefined): SectionNode['settings'] {
    if (!layout) return {};
    return {
        fullWidth: layout.fullWidth ?? true,
        paddingTop: layout.paddingTop ?? layout.padding,
        paddingBottom: layout.paddingBottom ?? layout.padding,
        paddingLeft: layout.paddingLeft,
        paddingRight: layout.paddingRight
    };
}
