import { Injectable, signal } from '@angular/core';
import { WidgetConfig, WidgetLayoutConfig } from './widget-config';

export interface GridLayout {
    columns: number; // Total columns in the grid (typically 12)
    rowHeight: number; // Height of each row in pixels
    gap: number; // Gap between grid items in pixels
}

export interface DragPosition {
    column: number;
    row: number;
}

@Injectable({
    providedIn: 'root'
})
export class PageLayoutService {
    // Default grid configuration
    private defaultGrid: GridLayout = {
        columns: 12,
        rowHeight: 100,
        gap: 0
    };

    gridConfig = signal<GridLayout>(this.defaultGrid);
    
    constructor() {}

    /**
     * Initialize a widget with default layout configuration
     */
    initializeWidgetLayout(widget: WidgetConfig): WidgetConfig {
        if (!widget.layout) {
            const autoPosition = this.findNextAvailablePosition([widget], 6); // Default 6-column span
            widget.layout = {
                column: autoPosition.column,
                row: autoPosition.row,
                columnSpan: 6,
                rowSpan: 1,
                fullWidth: false,
                padding: 16,
                margin: 0,
                zIndex: 1,
                autoHeight: true
            };
        }
        return widget;
    }

    /**
     * Find the next available position in the grid for a new widget
     */
    findNextAvailablePosition(existingWidgets: WidgetConfig[], spanWidth: number): DragPosition {
        if (existingWidgets.length === 0) {
            return { column: 1, row: 1 };
        }

        const grid = this.gridConfig();
        const occupiedCells = new Set<string>();

        // Mark all occupied cells
        existingWidgets.forEach(widget => {
            if (widget.layout) {
                for (let r = widget.layout.row; r < widget.layout.row + widget.layout.rowSpan; r++) {
                    for (let c = widget.layout.column; c < widget.layout.column + widget.layout.columnSpan; c++) {
                        occupiedCells.add(`${r}-${c}`);
                    }
                }
            }
        });

        // Find first available position
        let row = 1;
        while (true) {
            for (let col = 1; col <= grid.columns - spanWidth + 1; col++) {
                let canPlace = true;
                for (let c = col; c < col + spanWidth; c++) {
                    if (occupiedCells.has(`${row}-${c}`)) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    return { column: col, row };
                }
            }
            row++;
        }
    }

    /**
     * Check if a widget can be placed at a specific position
     */
    canPlaceWidget(
        widget: WidgetConfig,
        targetColumn: number,
        targetRow: number,
        otherWidgets: WidgetConfig[]
    ): boolean {
        if (!widget.layout) return false;

        const grid = this.gridConfig();
        const { columnSpan, rowSpan } = widget.layout;

        // Check if it fits within grid bounds
        if (targetColumn < 1 || targetColumn + columnSpan - 1 > grid.columns) {
            return false;
        }

        if (targetRow < 1) {
            return false;
        }

        // Check for collisions with other widgets
        for (const otherWidget of otherWidgets) {
            if (otherWidget.id === widget.id || !otherWidget.layout) continue;

            const collision = this.checkCollision(
                targetColumn,
                targetRow,
                columnSpan,
                rowSpan,
                otherWidget.layout.column,
                otherWidget.layout.row,
                otherWidget.layout.columnSpan,
                otherWidget.layout.rowSpan
            );

            if (collision) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if two rectangles collide
     */
    private checkCollision(
        x1: number, y1: number, w1: number, h1: number,
        x2: number, y2: number, w2: number, h2: number
    ): boolean {
        return !(
            x1 + w1 <= x2 ||
            x2 + w2 <= x1 ||
            y1 + h1 <= y2 ||
            y2 + h2 <= y1
        );
    }

    /**
     * Move a widget to a new position with automatic collision resolution
     */
    moveWidget(widget: WidgetConfig, targetColumn: number, targetRow: number, allWidgets?: WidgetConfig[]): boolean {
        if (!widget.layout) return false;

        widget.layout.column = Math.max(1, targetColumn);
        widget.layout.row = Math.max(1, targetRow);
        
        // If widgets array provided, resolve collisions
        if (allWidgets) {
            this.resolveCollisions(widget, allWidgets);
        }
        
        return true;
    }

    /**
     * Resolve collisions by pushing overlapping widgets down
     */
    private resolveCollisions(movedWidget: WidgetConfig, allWidgets: WidgetConfig[]): void {
        if (!movedWidget.layout) return;

        const movedLayout = movedWidget.layout;
        
        // Skip collision detection for auto-height widgets as they flow naturally
        if (movedLayout.autoHeight) return;
        
        const conflictingWidgets = allWidgets.filter(w => {
            if (w.id === movedWidget.id || !w.layout) return false;
            
            // Skip auto-height widgets in collision detection
            if (w.layout.autoHeight) return false;
            
            return this.checkCollision(
                movedLayout.column,
                movedLayout.row,
                movedLayout.columnSpan,
                movedLayout.rowSpan,
                w.layout.column,
                w.layout.row,
                w.layout.columnSpan,
                w.layout.rowSpan
            );
        });

        // Sort by row to push from top to bottom
        conflictingWidgets.sort((a, b) => a.layout!.row - b.layout!.row);

        // Push each conflicting widget down
        conflictingWidgets.forEach(conflictWidget => {
            if (!conflictWidget.layout || !movedLayout) return;
            
            // Calculate new row position (below the moved widget)
            const newRow = movedLayout.row + movedLayout.rowSpan;
            conflictWidget.layout.row = newRow;
            
            // Recursively check if this widget now conflicts with others
            this.resolveCollisions(conflictWidget, allWidgets);
        });
    }

    /**
     * Resize a widget
     */
    resizeWidget(widget: WidgetConfig, columnSpan: number, rowSpan: number): boolean {
        if (!widget.layout) return false;

        const grid = this.gridConfig();
        
        // Ensure the resize stays within bounds
        columnSpan = Math.max(1, Math.min(columnSpan, grid.columns - widget.layout.column + 1));
        rowSpan = Math.max(1, rowSpan);

        widget.layout.columnSpan = columnSpan;
        widget.layout.rowSpan = rowSpan;
        return true;
    }

    /**
     * Set a widget to full width
     */
    setFullWidth(widget: WidgetConfig, fullWidth: boolean): void {
        if (!widget.layout) return;

        widget.layout.fullWidth = fullWidth;
        if (fullWidth) {
            widget.layout.column = 1;
            widget.layout.columnSpan = this.gridConfig().columns;
        }
    }

    /**
     * Compact the grid by moving widgets up to fill empty spaces
     */
    compactGrid(widgets: WidgetConfig[]): WidgetConfig[] {
        // Sort widgets by row, then by column
        const sortedWidgets = [...widgets].sort((a, b) => {
            if (!a.layout || !b.layout) return 0;
            if (a.layout.row !== b.layout.row) {
                return a.layout.row - b.layout.row;
            }
            return a.layout.column - b.layout.column;
        });

        const compactedWidgets: WidgetConfig[] = [];

        for (const widget of sortedWidgets) {
            if (!widget.layout) continue;

            // Try to move the widget up as much as possible
            let targetRow = 1;
            while (targetRow < widget.layout.row) {
                if (this.canPlaceWidget(widget, widget.layout.column, targetRow, compactedWidgets)) {
                    widget.layout.row = targetRow;
                } else {
                    break;
                }
                targetRow++;
            }

            compactedWidgets.push(widget);
        }

        return widgets;
    }

    /**
     * Calculate the CSS grid styles for a widget
     */
    calculateGridStyles(widget: WidgetConfig): any {
        if (!widget.layout) return {};

        const layout = widget.layout;
        const grid = this.gridConfig();

        // Calculate padding - individual sides take precedence
        let padding: string | undefined;
        if (layout.paddingTop !== undefined || layout.paddingRight !== undefined || 
            layout.paddingBottom !== undefined || layout.paddingLeft !== undefined) {
            const top = layout.paddingTop ?? layout.padding ?? 0;
            const right = layout.paddingRight ?? layout.padding ?? 0;
            const bottom = layout.paddingBottom ?? layout.padding ?? 0;
            const left = layout.paddingLeft ?? layout.padding ?? 0;
            padding = `${top}px ${right}px ${bottom}px ${left}px`;
        } else if (layout.padding !== undefined) {
            padding = `${layout.padding}px`;
        }

        // Calculate margin - individual sides take precedence
        let margin: string | undefined;
        if (layout.marginTop !== undefined || layout.marginRight !== undefined || 
            layout.marginBottom !== undefined || layout.marginLeft !== undefined) {
            const top = layout.marginTop ?? layout.margin ?? 0;
            const right = layout.marginRight ?? layout.margin ?? 0;
            const bottom = layout.marginBottom ?? layout.margin ?? 0;
            const left = layout.marginLeft ?? layout.margin ?? 0;
            margin = `${top}px ${right}px ${bottom}px ${left}px`;
        } else if (layout.margin !== undefined) {
            margin = `${layout.margin}px`;
        }

        const baseStyles = {
            minHeight: layout.minHeight ? `${layout.minHeight}px` : undefined,
            maxHeight: layout.maxHeight ? `${layout.maxHeight}px` : undefined,
            padding,
            margin,
            backgroundColor: layout.backgroundColor,
            borderRadius: layout.borderRadius ? `${layout.borderRadius}px` : undefined,
            boxShadow: layout.boxShadow,
            zIndex: layout.zIndex
        };

        if (layout.fullWidth) {
            return {
                gridColumn: `1 / -1`,
                gridRow: layout.autoHeight ? 'auto' : `${layout.row} / span ${layout.rowSpan}`,
                ...baseStyles
            };
        }

        return {
            gridColumn: `${layout.column} / span ${layout.columnSpan}`,
            gridRow: layout.autoHeight ? 'auto' : `${layout.row} / span ${layout.rowSpan}`,
            ...baseStyles
        };
    }

    /**
     * Get the container CSS grid styles
     */
    getContainerGridStyles(): any {
        const grid = this.gridConfig();
        return {
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
            gridAutoRows: `minmax(${grid.rowHeight}px, auto)`, // Allow rows to expand
            gap: `${grid.gap}px`,
            width: '100%'
        };
    }

    /**
     * Update grid configuration
     */
    updateGridConfig(config: Partial<GridLayout>): void {
        this.gridConfig.set({ ...this.gridConfig(), ...config });
    }

    /**
     * Generate responsive classes for a widget
     */
    getResponsiveClasses(widget: WidgetConfig): string[] {
        const classes: string[] = [];
        
        if (widget.layout?.responsive) {
            const { mobile, tablet, desktop } = widget.layout.responsive;
            
            if (mobile?.hidden) classes.push('hidden-mobile');
            if (tablet?.hidden) classes.push('hidden-tablet');
            if (desktop?.hidden) classes.push('hidden-desktop');
        }
        
        return classes;
    }

    /**
     * Clone a widget with a new ID
     */
    cloneWidget(widget: WidgetConfig, otherWidgets: WidgetConfig[]): WidgetConfig {
        const cloned = JSON.parse(JSON.stringify(widget));
        cloned.id = this.generateId();
        
        if (cloned.layout) {
            const newPosition = this.findNextAvailablePosition(otherWidgets, cloned.layout.columnSpan);
            cloned.layout.column = newPosition.column;
            cloned.layout.row = newPosition.row;
        }
        
        return cloned;
    }

    private generateId(): string {
        return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
