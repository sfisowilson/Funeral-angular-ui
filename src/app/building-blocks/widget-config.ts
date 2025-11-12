export interface WidgetConfig {
    id: string;
    type: string;
    title?: string;
    settings: any;
    layout?: WidgetLayoutConfig;
}

export interface WidgetLayoutConfig {
    // Grid positioning
    column: number; // 1-12 (12-column grid)
    columnSpan: number; // How many columns to span (1-12)
    row: number; // Row number in the grid
    rowSpan: number; // How many rows to span
    
    // Display options
    fullWidth?: boolean; // Override to use full container width
    autoHeight?: boolean; // Use auto height instead of fixed row span
    minHeight?: number; // Minimum height in pixels
    maxHeight?: number; // Maximum height in pixels
    
    // Responsive breakpoints
    responsive?: {
        mobile?: { columnSpan: number; order?: number; hidden?: boolean };
        tablet?: { columnSpan: number; order?: number; hidden?: boolean };
        desktop?: { columnSpan: number; order?: number; hidden?: boolean };
    };
    
    // Styling
    padding?: number; // Internal padding
    margin?: number; // External margin
    backgroundColor?: string;
    borderRadius?: number;
    boxShadow?: string;
    
    // Z-index for layering
    zIndex?: number;
    
    // Animations
    animationType?: 'none' | 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'bounce' | 'rotate-in';
    animationDuration?: number; // Duration in milliseconds (default: 600)
    animationDelay?: number; // Delay in milliseconds
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    animationEnabled?: boolean; // Toggle animations on/off
    
    // Hover Effects
    hoverEffect?: 'none' | 'lift' | 'glow' | 'scale';
}
