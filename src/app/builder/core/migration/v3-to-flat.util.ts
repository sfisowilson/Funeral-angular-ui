import { WidgetConfig, WidgetLayoutConfig } from '../../../building-blocks/widget-config';
import { BlockNode, PageDocument } from '../document.model';

/**
 * Converts a v3 PageDocument back to the legacy flat WidgetConfig array.
 * This is used when saving to the existing backend (PUT /api/CustomPages/{id}),
 * which still expects the flat JSON array format in the Content column.
 *
 * The round-trip preserves all widget settings and reconstructs layout.row /
 * layout.column / layout.columnSpan from the section/column structure.
 */
export function v3ToFlat(doc: PageDocument): WidgetConfig[] {
    const result: WidgetConfig[] = [];
    let globalOrder = 1;

    doc.sections.forEach((section, sectionIndex) => {
        const row = sectionIndex + 1;

        // Distribute columns across 12-column grid
        const totalCols = 12;
        let currentCol = 1;

        section.columns.forEach((column) => {
            const columnSpan = Math.max(1, Math.round(column.widthFraction * totalCols));

            column.blocks.forEach((block) => {
                const widget = blockToWidget(block, {
                    column: currentCol,
                    columnSpan,
                    row,
                    rowSpan: 1,
                    fullWidth: section.settings?.fullWidth ?? true,
                    autoHeight: true,
                    paddingTop: section.settings?.paddingTop,
                    paddingBottom: section.settings?.paddingBottom,
                    paddingLeft: section.settings?.paddingLeft,
                    paddingRight: section.settings?.paddingRight
                }, globalOrder);
                result.push(widget);
                globalOrder++;
            });

            currentCol += columnSpan;
        });
    });

    return result;
}

// ─── Internal helpers ────────────────────────────────────────

function blockToWidget(block: BlockNode, layout: WidgetLayoutConfig, order: number): WidgetConfig {
    // Extract animation settings back to layout if they exist in settings
    const settings = { ...block.settings };
    const animationType = settings['animationType'] as WidgetLayoutConfig['animationType'];
    const animationDuration = settings['animationDuration'] as number | undefined;
    const animationDelay = settings['animationDelay'] as number | undefined;
    const animationEnabled = settings['animationEnabled'] as boolean | undefined;
    const hoverEffect = settings['hoverEffect'] as WidgetLayoutConfig['hoverEffect'];

    return {
        id: block.id,
        type: block.type,
        order,
        settings: block.settings as any,
        blockStyles: block.blockStyles,
        visibility: block.visibility,
        styleOverrides: block.styleOverrides,
        children: block.children?.map((child) => blockToWidget(child, { ...layout }, order)),
        layout: {
            ...layout,
            ...(animationType && { animationType }),
            ...(animationDuration !== undefined && { animationDuration }),
            ...(animationDelay !== undefined && { animationDelay }),
            ...(animationEnabled !== undefined && { animationEnabled }),
            ...(hoverEffect && { hoverEffect })
        }
    } as WidgetConfig & { order: number };
}
