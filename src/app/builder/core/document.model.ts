/**
 * PageDocument v3 — Hierarchical page model for the visual builder.
 * Structure: PageDocument → SectionNode[] → ColumnNode[] → BlockNode[]
 * BlockNode.children supports container widgets (query-loop, tabs, accordion).
 * BlockNode.bindings supports token-based template binding (e.g. {{record.title}}).
 */

// ─────────────────────────────────────────────────────────────
// Root document
// ─────────────────────────────────────────────────────────────

export interface PageDocument {
    __version: 3;
    type: 'page' | 'template' | 'record-template';
    id: string;
    /** Slug of the ContentType this template belongs to (record-template only) */
    contentTypeSlug?: string;
    seoConfig?: SeoConfig;
    globalStyles?: DesignTokens;
    sections: SectionNode[];
}

// ─────────────────────────────────────────────────────────────
// Structure nodes
// ─────────────────────────────────────────────────────────────

export interface SectionNode {
    id: string;
    settings: SectionSettings;
    columns: ColumnNode[];
}

export interface ColumnNode {
    id: string;
    /** Fraction of section width (0–1). All columns in a section must sum to 1.0. */
    widthFraction: number;
    settings?: ColumnSettings;
    blocks: BlockNode[];
}

export interface BlockNode {
    id: string;
    /** Widget type key matching WIDGET_TYPES[].name in the registry */
    type: string;
    settings: Record<string, unknown>;
    /**
     * Token bindings: map from settingsPath to token string.
     * e.g. { "title": "{{record.name}}", "imageUrl": "{{record.mainImage}}" }
     * Used by TemplateResolverService to substitute before rendering.
     */
    bindings?: TemplateBindingMap;
    /**
     * Per-breakpoint style overrides applied on top of settings.
     * Tablet/mobile keys override specific settings for that breakpoint.
     */
    styleOverrides?: ResponsiveStyleOverrides;
    visibility?: VisibilityConfig;
    /** Wrapper-level styling applied to the block container div in the canvas. */
    blockStyles?: BlockStyles;
    /**
     * Child blocks for container widgets (query-loop inner template, tabs, accordion panels).
     * These blocks share the same typing — the parent widget controls how they are rendered.
     */
    children?: BlockNode[];
}

// ─────────────────────────────────────────────────────────────
// Block-level wrapper styles (applied to the .block-wrapper div)
// ─────────────────────────────────────────────────────────────

export interface BlockStyles {
    // ── Spacing ─────────────────────────────────────────────────
    paddingTop?: number; paddingTopUnit?: string;
    paddingRight?: number; paddingRightUnit?: string;
    paddingBottom?: number; paddingBottomUnit?: string;
    paddingLeft?: number; paddingLeftUnit?: string;
    marginTop?: number; marginTopUnit?: string;
    marginRight?: number; marginRightUnit?: string;
    marginBottom?: number; marginBottomUnit?: string;
    marginLeft?: number; marginLeftUnit?: string;
    // ── Background ──────────────────────────────────────────────
    background?: BackgroundValue;
    /** Hover-state background (applied via injected CSS :hover rule) */
    hoverBackground?: BackgroundValue;
    // ── Border ──────────────────────────────────────────────────
    /** Uniform border width (used when per-side widths are not set) */
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderColor?: string;
    /** Uniform border radius (used when per-corner are not set) */
    borderRadius?: number;
    /** Per-side border widths (override borderWidth when set) */
    borderTopWidth?: number; borderRightWidth?: number;
    borderBottomWidth?: number; borderLeftWidth?: number;
    /** Per-corner border radii (override borderRadius when set) */
    borderRadiusTL?: number; borderRadiusTR?: number;
    borderRadiusBR?: number; borderRadiusBL?: number;
    /** Hover border color (injected as :hover CSS) */
    hoverBorderColor?: string;
    // ── Shadow ───────────────────────────────────────────────────
    boxShadow?: string;
    hoverBoxShadow?: string;
    textShadow?: string;
    // ── Dimensions ───────────────────────────────────────────────
    width?: string; widthUnit?: string;
    maxWidth?: string; maxWidthUnit?: string;
    minHeight?: number; minHeightUnit?: string;
    // ── Position ─────────────────────────────────────────────────
    zIndex?: number;
    positionType?: 'default' | 'relative' | 'absolute' | 'fixed';
    positionTop?: number; positionTopUnit?: string;
    positionRight?: number; positionRightUnit?: string;
    positionBottom?: number; positionBottomUnit?: string;
    positionLeft?: number; positionLeftUnit?: string;
    // ── Typography ───────────────────────────────────────────────
    fontFamily?: string;
    fontSize?: number; fontSizeUnit?: string;
    fontWeight?: string;
    fontStyle?: 'normal' | 'italic' | 'oblique';
    textDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    lineHeight?: number;
    letterSpacing?: number;
    wordSpacing?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    // ── Transform ────────────────────────────────────────────────
    transformRotate?: number;
    transformScaleX?: number; transformScaleY?: number;
    transformSkewX?: number; transformSkewY?: number;
    transformTranslateX?: number; transformTranslateXUnit?: string;
    transformTranslateY?: number; transformTranslateYUnit?: string;
    // ── Entrance Animation ───────────────────────────────────────
    animationEnabled?: boolean;
    animationType?: 'none' | 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'bounce';
    animationDuration?: number;
    animationDelay?: number;
    // ── Scroll Motion ─────────────────────────────────────────────
    motionScrollParallax?: number;
    motionScrollOpacityFrom?: number; motionScrollOpacityTo?: number;
    motionScrollScaleFrom?: number; motionScrollScaleTo?: number;
    motionScrollBlur?: number;
    // ── Advanced ─────────────────────────────────────────────────
    cssClass?: string;
    customCss?: string;
    /** Custom HTML attributes applied to the block wrapper element */
    htmlAttributes?: { key: string; value: string }[];
}

// ─────────────────────────────────────────────────────────────
// Settings shapes
// ─────────────────────────────────────────────────────────────

export interface SectionSettings {
    background?: BackgroundValue;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    minHeight?: number;
    fullWidth?: boolean;
    /** Container max-width in px (null = full width) */
    containerMaxWidth?: number | null;
    cssClass?: string;
    anchorId?: string;
}

export interface ColumnSettings {
    verticalAlign?: 'top' | 'center' | 'bottom';
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    background?: BackgroundValue;
}

// ─────────────────────────────────────────────────────────────
// Responsive & visibility
// ─────────────────────────────────────────────────────────────

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ResponsiveStyleOverrides {
    /** Applied when viewport is tablet width (≤1024px) */
    tablet?: Partial<Record<string, unknown>>;
    /** Applied when viewport is mobile width (≤768px) */
    mobile?: Partial<Record<string, unknown>>;
}

export interface VisibilityConfig {
    hideOnDesktop?: boolean;
    hideOnTablet?: boolean;
    hideOnMobile?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────

export interface BackgroundValue {
    type: 'solid' | 'gradient' | 'image' | 'none';
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientAngle?: number;
    imageUrl?: string;
    imageSize?: 'cover' | 'contain' | 'auto';
    imagePosition?: string;
    imageRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    overlayColor?: string;
    overlayOpacity?: number;
}

// ─────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────

export interface SeoConfig {
    /** Supports token syntax: {{record.title}} */
    title?: string;
    /** Supports token syntax */
    description?: string;
    /** Supports token syntax for dynamic image URL */
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    structuredDataJson?: string;
}

// ─────────────────────────────────────────────────────────────
// Design tokens (Global Styles)
// ─────────────────────────────────────────────────────────────

export interface DesignTokens {
    colors?: Record<string, string>;
    typography?: Record<string, TypographyToken>;
    spacing?: Record<string, number>;
    borderRadius?: Record<string, number>;
}

export interface TypographyToken {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number;
    letterSpacing?: number;
}

// ─────────────────────────────────────────────────────────────
// Template binding (record-template mode)
// ─────────────────────────────────────────────────────────────

/**
 * Maps a settings property path to a token string.
 * e.g. { title: "{{record.name}}", imageUrl: "{{record.hero.url}}" }
 */
export type TemplateBindingMap = Record<string, string>;

/**
 * Context passed to TemplateResolverService when resolving token bindings.
 */
export interface TemplateContext {
    record?: Record<string, unknown>;
    page?: {
        title?: string;
        slug?: string;
        description?: string;
    };
    tenant?: {
        brandName?: string;
        primaryColor?: string;
        logoUrl?: string;
    };
}

// ─────────────────────────────────────────────────────────────
// Drag state (used by PageDocumentStore)
// ─────────────────────────────────────────────────────────────

export interface DragState {
    /** 'library' when dragging from the widget library panel */
    source: 'library' | 'canvas';
    /** Widget type key if source is 'library' */
    widgetType?: string;
    /** Block id if source is 'canvas' */
    blockId?: string;
}

// ─────────────────────────────────────────────────────────────
// Builder UI state types (referenced by the store)
// ─────────────────────────────────────────────────────────────

export type BuilderMode = 'edit' | 'preview';
export type LeftPanelMode = 'library' | 'layers' | 'styles' | 'site' | 'history';
export type DocumentType = 'page' | 'template' | 'record-template';
