import { WidgetConfig } from '../../../building-blocks/widget-config';
import { BackgroundValue, BlockNode, BlockStyles, Breakpoint, SectionSettings, VisibilityConfig } from '../document.model';

function withUnit(value: number | undefined, unit?: string): string | null {
    return value != null ? `${value}${unit || 'px'}` : null;
}

function allEqual(values: Array<number | undefined>): number | undefined {
    const defined = values.filter((value): value is number => value != null);
    if (defined.length !== values.length || defined.length === 0) {
        return undefined;
    }
    return defined.every((value) => value === defined[0]) ? defined[0] : undefined;
}

function formatDimension(value: string | undefined, unit?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    if (!unit || /[a-z%]+$/i.test(value)) {
        return value;
    }

    return `${value}${unit}`;
}

export function getBackgroundCss(bg?: BackgroundValue): Record<string, string> {
    if (!bg || bg.type === 'none' || !bg.type) return {};
    if (bg.type === 'solid') return { background: bg.color ?? '' };
    if (bg.type === 'gradient') {
        return { background: `linear-gradient(${bg.gradientAngle ?? 135}deg, ${bg.gradientStart ?? '#fff'}, ${bg.gradientEnd ?? '#000'})` };
    }
    if (bg.type === 'image' && bg.imageUrl) {
        return {
            'background-image': `url('${bg.imageUrl}')`,
            'background-size': bg.imageSize ?? 'cover',
            'background-position': bg.imagePosition ?? 'center',
            'background-repeat': bg.imageRepeat ?? 'no-repeat'
        };
    }
    return {};
}

export function getSectionRenderStyles(settings: SectionSettings): Record<string, string> {
    const styles: Record<string, string> = {};
    if (settings.paddingTop != null) styles['padding-top'] = `${settings.paddingTop}px`;
    if (settings.paddingRight != null) styles['padding-right'] = `${settings.paddingRight}px`;
    if (settings.paddingBottom != null) styles['padding-bottom'] = `${settings.paddingBottom}px`;
    if (settings.paddingLeft != null) styles['padding-left'] = `${settings.paddingLeft}px`;
    if (settings.minHeight != null) styles['min-height'] = `${settings.minHeight}px`;
    Object.assign(styles, getBackgroundCss(settings.background));
    return styles;
}

export function isBlockHiddenForBreakpoint(visibility?: VisibilityConfig, breakpoint: Breakpoint = 'desktop'): boolean {
    if (!visibility) return false;
    if (breakpoint === 'desktop' && visibility.hideOnDesktop) return true;
    if (breakpoint === 'tablet' && visibility.hideOnTablet) return true;
    if (breakpoint === 'mobile' && visibility.hideOnMobile) return true;
    return false;
}

export function getBlockWrapperRenderStyles(
    block: Pick<BlockNode, 'blockStyles' | 'visibility'>,
    breakpoint: Breakpoint = 'desktop'
): Record<string, string> {
    const styles: Record<string, string> = {};
    if (isBlockHiddenForBreakpoint(block.visibility, breakpoint)) {
        styles['display'] = 'none';
        return styles;
    }

    const blockStyles = block.blockStyles;
    if (!blockStyles) return styles;

    if (blockStyles.paddingTop != null) styles['padding-top'] = withUnit(blockStyles.paddingTop, blockStyles.paddingTopUnit)!;
    if (blockStyles.paddingRight != null) styles['padding-right'] = withUnit(blockStyles.paddingRight, blockStyles.paddingRightUnit)!;
    if (blockStyles.paddingBottom != null) styles['padding-bottom'] = withUnit(blockStyles.paddingBottom, blockStyles.paddingBottomUnit)!;
    if (blockStyles.paddingLeft != null) styles['padding-left'] = withUnit(blockStyles.paddingLeft, blockStyles.paddingLeftUnit)!;
    if (blockStyles.marginTop != null) styles['margin-top'] = withUnit(blockStyles.marginTop, blockStyles.marginTopUnit)!;
    if (blockStyles.marginRight != null) styles['margin-right'] = withUnit(blockStyles.marginRight, blockStyles.marginRightUnit)!;
    if (blockStyles.marginBottom != null) styles['margin-bottom'] = withUnit(blockStyles.marginBottom, blockStyles.marginBottomUnit)!;
    if (blockStyles.marginLeft != null) styles['margin-left'] = withUnit(blockStyles.marginLeft, blockStyles.marginLeftUnit)!;

    Object.assign(styles, getBackgroundCss(blockStyles.background));

    if (
        blockStyles.borderTopWidth != null ||
        blockStyles.borderRightWidth != null ||
        blockStyles.borderBottomWidth != null ||
        blockStyles.borderLeftWidth != null
    ) {
        styles['border-top-width'] = `${blockStyles.borderTopWidth ?? 0}px`;
        styles['border-right-width'] = `${blockStyles.borderRightWidth ?? 0}px`;
        styles['border-bottom-width'] = `${blockStyles.borderBottomWidth ?? 0}px`;
        styles['border-left-width'] = `${blockStyles.borderLeftWidth ?? 0}px`;
    } else if (blockStyles.borderWidth != null) {
        styles['border-width'] = `${blockStyles.borderWidth}px`;
    }
    if (blockStyles.borderStyle) styles['border-style'] = blockStyles.borderStyle;
    if (blockStyles.borderColor) styles['border-color'] = blockStyles.borderColor;
    if (
        blockStyles.borderRadiusTL != null ||
        blockStyles.borderRadiusTR != null ||
        blockStyles.borderRadiusBR != null ||
        blockStyles.borderRadiusBL != null
    ) {
        styles['border-radius'] = `${blockStyles.borderRadiusTL ?? 0}px ${blockStyles.borderRadiusTR ?? 0}px ${blockStyles.borderRadiusBR ?? 0}px ${blockStyles.borderRadiusBL ?? 0}px`;
    } else if (blockStyles.borderRadius != null) {
        styles['border-radius'] = `${blockStyles.borderRadius}px`;
    }

    if (blockStyles.boxShadow) styles['box-shadow'] = blockStyles.boxShadow;
    if (blockStyles.textShadow) styles['text-shadow'] = blockStyles.textShadow;

    const width = formatDimension(blockStyles.width, blockStyles.widthUnit);
    const maxWidth = formatDimension(blockStyles.maxWidth, blockStyles.maxWidthUnit);
    if (width) styles['width'] = width;
    if (maxWidth) styles['max-width'] = maxWidth;
    if (blockStyles.minHeight != null) styles['min-height'] = withUnit(blockStyles.minHeight, blockStyles.minHeightUnit)!;

    if (blockStyles.zIndex != null) styles['z-index'] = String(blockStyles.zIndex);
    if (blockStyles.positionType && blockStyles.positionType !== 'default') {
        styles['position'] = blockStyles.positionType;
        if (blockStyles.positionTop != null) styles['top'] = withUnit(blockStyles.positionTop, blockStyles.positionTopUnit)!;
        if (blockStyles.positionRight != null) styles['right'] = withUnit(blockStyles.positionRight, blockStyles.positionRightUnit)!;
        if (blockStyles.positionBottom != null) styles['bottom'] = withUnit(blockStyles.positionBottom, blockStyles.positionBottomUnit)!;
        if (blockStyles.positionLeft != null) styles['left'] = withUnit(blockStyles.positionLeft, blockStyles.positionLeftUnit)!;
    }

    if (blockStyles.fontFamily) styles['font-family'] = blockStyles.fontFamily;
    if (blockStyles.fontSize != null) styles['font-size'] = withUnit(blockStyles.fontSize, blockStyles.fontSizeUnit || 'px')!;
    if (blockStyles.fontWeight) styles['font-weight'] = blockStyles.fontWeight;
    if (blockStyles.fontStyle) styles['font-style'] = blockStyles.fontStyle;
    if (blockStyles.textDecoration) styles['text-decoration'] = blockStyles.textDecoration;
    if (blockStyles.textTransform) styles['text-transform'] = blockStyles.textTransform;
    if (blockStyles.lineHeight != null) styles['line-height'] = String(blockStyles.lineHeight);
    if (blockStyles.letterSpacing != null) styles['letter-spacing'] = `${blockStyles.letterSpacing}em`;
    if (blockStyles.wordSpacing != null) styles['word-spacing'] = `${blockStyles.wordSpacing}px`;
    if (blockStyles.textAlign) styles['text-align'] = blockStyles.textAlign;

    const transforms: string[] = [];
    if (blockStyles.transformRotate != null && blockStyles.transformRotate !== 0) transforms.push(`rotate(${blockStyles.transformRotate}deg)`);
    if (blockStyles.transformScaleX != null && blockStyles.transformScaleX !== 1) transforms.push(`scaleX(${blockStyles.transformScaleX})`);
    if (blockStyles.transformScaleY != null && blockStyles.transformScaleY !== 1) transforms.push(`scaleY(${blockStyles.transformScaleY})`);
    if (blockStyles.transformSkewX != null && blockStyles.transformSkewX !== 0) transforms.push(`skewX(${blockStyles.transformSkewX}deg)`);
    if (blockStyles.transformSkewY != null && blockStyles.transformSkewY !== 0) transforms.push(`skewY(${blockStyles.transformSkewY}deg)`);
    if (blockStyles.transformTranslateX != null && blockStyles.transformTranslateX !== 0) {
        transforms.push(`translateX(${withUnit(blockStyles.transformTranslateX, blockStyles.transformTranslateXUnit || 'px')})`);
    }
    if (blockStyles.transformTranslateY != null && blockStyles.transformTranslateY !== 0) {
        transforms.push(`translateY(${withUnit(blockStyles.transformTranslateY, blockStyles.transformTranslateYUnit || 'px')})`);
    }
    if (transforms.length) styles['transform'] = transforms.join(' ');

    return styles;
}

export function resolveEffectiveWidgetSettings(
    settings: Record<string, unknown> | null | undefined,
    blockStyles?: BlockStyles
): Record<string, unknown> {
    const resolved: Record<string, unknown> = { ...(settings ?? {}) };
    if (!blockStyles) {
        return resolved;
    }

    const paddingTop = blockStyles.paddingTop;
    const paddingRight = blockStyles.paddingRight;
    const paddingBottom = blockStyles.paddingBottom;
    const paddingLeft = blockStyles.paddingLeft;
    const marginTop = blockStyles.marginTop;
    const marginRight = blockStyles.marginRight;
    const marginBottom = blockStyles.marginBottom;
    const marginLeft = blockStyles.marginLeft;

    if (paddingTop != null) resolved['paddingTop'] = paddingTop;
    if (paddingRight != null) resolved['paddingRight'] = paddingRight;
    if (paddingBottom != null) resolved['paddingBottom'] = paddingBottom;
    if (paddingLeft != null) resolved['paddingLeft'] = paddingLeft;
    if (marginTop != null) resolved['marginTop'] = marginTop;
    if (marginRight != null) resolved['marginRight'] = marginRight;
    if (marginBottom != null) resolved['marginBottom'] = marginBottom;
    if (marginLeft != null) resolved['marginLeft'] = marginLeft;

    const uniformPadding = allEqual([paddingTop, paddingRight, paddingBottom, paddingLeft]);
    const uniformMargin = allEqual([marginTop, marginRight, marginBottom, marginLeft]);
    if (uniformPadding != null) resolved['padding'] = uniformPadding;
    if (uniformMargin != null) resolved['margin'] = uniformMargin;

    if (blockStyles.background?.type === 'solid' && blockStyles.background.color) {
        resolved['backgroundColor'] = blockStyles.background.color;
        resolved['backgroundOpacity'] = 1;
    }

    const borderWidth = blockStyles.borderWidth ?? allEqual([
        blockStyles.borderTopWidth,
        blockStyles.borderRightWidth,
        blockStyles.borderBottomWidth,
        blockStyles.borderLeftWidth
    ]);
    const borderRadius = blockStyles.borderRadius ?? allEqual([
        blockStyles.borderRadiusTL,
        blockStyles.borderRadiusTR,
        blockStyles.borderRadiusBR,
        blockStyles.borderRadiusBL
    ]);

    if (borderWidth != null) resolved['borderWidth'] = borderWidth;
    if (blockStyles.borderStyle) resolved['borderStyle'] = blockStyles.borderStyle;
    if (blockStyles.borderColor) resolved['borderColor'] = blockStyles.borderColor;
    if (borderRadius != null) resolved['borderRadius'] = borderRadius;
    if (blockStyles.boxShadow) resolved['boxShadow'] = blockStyles.boxShadow;

    if (blockStyles.fontFamily) resolved['fontFamily'] = blockStyles.fontFamily;
    if (blockStyles.fontSize != null) resolved['fontSize'] = blockStyles.fontSize;
    if (blockStyles.fontWeight) resolved['fontWeight'] = blockStyles.fontWeight;
    if (blockStyles.fontStyle) resolved['fontStyle'] = blockStyles.fontStyle;
    if (blockStyles.textDecoration) resolved['textDecoration'] = blockStyles.textDecoration;
    if (blockStyles.textTransform) resolved['textTransform'] = blockStyles.textTransform;
    if (blockStyles.lineHeight != null) resolved['lineHeight'] = blockStyles.lineHeight;
    if (blockStyles.letterSpacing != null) resolved['letterSpacing'] = blockStyles.letterSpacing;
    if (blockStyles.wordSpacing != null) resolved['wordSpacing'] = blockStyles.wordSpacing;
    if (blockStyles.textAlign) resolved['textAlign'] = blockStyles.textAlign;
    if (blockStyles.textShadow) resolved['textShadow'] = blockStyles.textShadow;

    const width = formatDimension(blockStyles.width, blockStyles.widthUnit);
    const maxWidth = formatDimension(blockStyles.maxWidth, blockStyles.maxWidthUnit);
    if (width) resolved['width'] = width;
    if (maxWidth) resolved['maxWidth'] = maxWidth;
    if (blockStyles.minHeight != null) resolved['minHeight'] = blockStyles.minHeight;
    if (blockStyles.zIndex != null) resolved['zIndex'] = blockStyles.zIndex;

    if (blockStyles.animationEnabled != null) resolved['animationEnabled'] = blockStyles.animationEnabled;
    if (blockStyles.animationType) resolved['animationType'] = blockStyles.animationType;
    if (blockStyles.animationDuration != null) resolved['animationDuration'] = blockStyles.animationDuration;
    if (blockStyles.animationDelay != null) resolved['animationDelay'] = blockStyles.animationDelay;

    return resolved;
}

export function buildRenderableWidgetConfig(block: Pick<BlockNode, 'id' | 'type' | 'settings' | 'blockStyles' | 'visibility' | 'styleOverrides' | 'children'>): WidgetConfig {
    return {
        id: block.id,
        type: block.type,
        settings: resolveEffectiveWidgetSettings(block.settings as Record<string, unknown>, block.blockStyles),
        blockStyles: block.blockStyles,
        visibility: block.visibility,
        styleOverrides: block.styleOverrides,
        children: block.children?.map((child) => buildRenderableWidgetConfig(child))
    };
}