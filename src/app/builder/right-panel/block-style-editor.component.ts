import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageDocumentStore } from '../core/page-document.store';
import { BlockNode, BlockStyles, BackgroundValue } from '../core/document.model';
import { UpdateBlockSettingsCommand, UpdateBlockStylesCommand } from '../core/commands/commands';

interface WidgetStyleField {
    key: string;
    label: string;
    kind: 'color' | 'number' | 'boolean' | 'text';
    value: unknown;
}

@Component({
    selector: 'app-block-style-editor',
    standalone: true,
    imports: [CommonModule],
    template: `
<div class="se">

    @if (widgetStyleFields().length) {
        <details class="se-group" open>
            <summary class="se-group-title">Widget Styles</summary>
            <div class="se-group-body">
                @for (field of widgetStyleFields(); track field.key) {
                    <div class="se-row">
                        <label class="se-label">{{ field.label }}</label>

                        @if (field.kind === 'color') {
                            <div class="color-row">
                                <input
                                    type="color"
                                    class="color-swatch"
                                    [value]="asColor(field.value)"
                                    (input)="updateWidgetSetting(field.key, $any($event.target).value)"
                                />
                                <input
                                    type="text"
                                    class="se-input"
                                    [value]="field.value ?? ''"
                                    (input)="updateWidgetSetting(field.key, $any($event.target).value || undefined)"
                                />
                            </div>
                        } @else if (field.kind === 'boolean') {
                            <input
                                type="checkbox"
                                class="se-checkbox"
                                [checked]="$any(field.value) === true"
                                (change)="updateWidgetSetting(field.key, $any($event.target).checked)"
                            />
                        } @else if (field.kind === 'number') {
                            <input
                                type="number"
                                class="se-input"
                                [value]="field.value ?? ''"
                                (input)="updateWidgetSetting(field.key, toNum($event))"
                            />
                        } @else {
                            <input
                                type="text"
                                class="se-input"
                                [value]="field.value ?? ''"
                                (input)="updateWidgetSetting(field.key, $any($event.target).value || undefined)"
                            />
                        }
                    </div>
                }
            </div>
        </details>
    }

    <!-- ══════════════ SPACING ══════════════ -->
    <details class="se-group" open>
        <summary class="se-group-title">Spacing</summary>
        <div class="se-group-body">

            <p class="se-sub">Padding</p>
            <div class="box-grid">
                <div class="box-cell">
                    <label>Top</label>
                    <div class="input-unit">
                        <input type="number" min="0" [value]="bs('paddingTop')"
                            (input)="update('paddingTop', toNum($event))" />
                        <select [value]="bs('paddingTopUnit') || 'px'"
                            (change)="update('paddingTopUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option><option>vw</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Right</label>
                    <div class="input-unit">
                        <input type="number" min="0" [value]="bs('paddingRight')"
                            (input)="update('paddingRight', toNum($event))" />
                        <select [value]="bs('paddingRightUnit') || 'px'"
                            (change)="update('paddingRightUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option><option>vw</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Bottom</label>
                    <div class="input-unit">
                        <input type="number" min="0" [value]="bs('paddingBottom')"
                            (input)="update('paddingBottom', toNum($event))" />
                        <select [value]="bs('paddingBottomUnit') || 'px'"
                            (change)="update('paddingBottomUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option><option>vw</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Left</label>
                    <div class="input-unit">
                        <input type="number" min="0" [value]="bs('paddingLeft')"
                            (input)="update('paddingLeft', toNum($event))" />
                        <select [value]="bs('paddingLeftUnit') || 'px'"
                            (change)="update('paddingLeftUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option><option>vw</option>
                        </select>
                    </div>
                </div>
            </div>

            <p class="se-sub" style="margin-top:12px">Margin</p>
            <div class="box-grid">
                <div class="box-cell">
                    <label>Top</label>
                    <div class="input-unit">
                        <input type="number" [value]="bs('marginTop')"
                            (input)="update('marginTop', toNum($event))" />
                        <select [value]="bs('marginTopUnit') || 'px'"
                            (change)="update('marginTopUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Right</label>
                    <div class="input-unit">
                        <input type="number" [value]="bs('marginRight')"
                            (input)="update('marginRight', toNum($event))" />
                        <select [value]="bs('marginRightUnit') || 'px'"
                            (change)="update('marginRightUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Bottom</label>
                    <div class="input-unit">
                        <input type="number" [value]="bs('marginBottom')"
                            (input)="update('marginBottom', toNum($event))" />
                        <select [value]="bs('marginBottomUnit') || 'px'"
                            (change)="update('marginBottomUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option>
                        </select>
                    </div>
                </div>
                <div class="box-cell">
                    <label>Left</label>
                    <div class="input-unit">
                        <input type="number" [value]="bs('marginLeft')"
                            (input)="update('marginLeft', toNum($event))" />
                        <select [value]="bs('marginLeftUnit') || 'px'"
                            (change)="update('marginLeftUnit', $any($event.target).value)">
                            <option>px</option><option>em</option><option>rem</option><option>%</option>
                        </select>
                    </div>
                </div>
            </div>

        </div>
    </details>

    <!-- ══════════════ BACKGROUND ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Background</summary>
        <div class="se-group-body">

            <!-- Normal / Hover sub-tabs -->
            <div class="sub-tabs">
                <button class="sub-tab" [class.active]="bgTab === 'normal'" (click)="bgTab = 'normal'">Normal</button>
                <button class="sub-tab" [class.active]="bgTab === 'hover'" (click)="bgTab = 'hover'">Hover</button>
            </div>

            @if (bgTab === 'normal') {
                <div class="se-row">
                    <label class="se-label">Type</label>
                    <select class="se-input" [value]="bgType('background')"
                        (change)="updateBgType('background', $any($event.target).value)">
                        <option value="none">None</option>
                        <option value="solid">Solid Color</option>
                        <option value="gradient">Gradient</option>
                        <option value="image">Image</option>
                    </select>
                </div>
                @if (bgType('background') === 'solid') {
                    <div class="se-row">
                        <label class="se-label">Color</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('background','color') || '#ffffff'"
                                (input)="updateBgProp('background','color',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('background','color') || ''"
                                placeholder="#ffffff" (input)="updateBgProp('background','color',$any($event.target).value)" />
                        </div>
                    </div>
                }
                @if (bgType('background') === 'gradient') {
                    <div class="se-row">
                        <label class="se-label">From</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('background','gradientStart') || '#4facfe'"
                                (input)="updateBgProp('background','gradientStart',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('background','gradientStart') || ''"
                                (input)="updateBgProp('background','gradientStart',$any($event.target).value)" />
                        </div>
                    </div>
                    <div class="se-row">
                        <label class="se-label">To</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('background','gradientEnd') || '#00f2fe'"
                                (input)="updateBgProp('background','gradientEnd',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('background','gradientEnd') || ''"
                                (input)="updateBgProp('background','gradientEnd',$any($event.target).value)" />
                        </div>
                    </div>
                    <div class="se-row">
                        <label class="se-label">Angle (deg)</label>
                        <input type="number" class="se-input" min="0" max="360"
                            [value]="bgProp('background','gradientAngle') ?? 135"
                            (input)="updateBgProp('background','gradientAngle',toNum($event))" />
                    </div>
                }
                @if (bgType('background') === 'image') {
                    <div class="se-row">
                        <label class="se-label">Image URL</label>
                        <input type="text" class="se-input" [value]="bgProp('background','imageUrl') || ''"
                            placeholder="https://..." (input)="updateBgProp('background','imageUrl',$any($event.target).value)" />
                    </div>
                    <div class="se-row">
                        <label class="se-label">Size</label>
                        <select class="se-input" [value]="bgProp('background','imageSize') || 'cover'"
                            (change)="updateBgProp('background','imageSize',$any($event.target).value)">
                            <option value="cover">Cover</option><option value="contain">Contain</option><option value="auto">Auto</option>
                        </select>
                    </div>
                    <div class="se-row">
                        <label class="se-label">Position</label>
                        <input type="text" class="se-input" [value]="bgProp('background','imagePosition') || 'center'"
                            (input)="updateBgProp('background','imagePosition',$any($event.target).value)" />
                    </div>
                    <div class="se-row">
                        <label class="se-label">Repeat</label>
                        <select class="se-input" [value]="bgProp('background','imageRepeat') || 'no-repeat'"
                            (change)="updateBgProp('background','imageRepeat',$any($event.target).value)">
                            <option value="no-repeat">No Repeat</option><option value="repeat">Repeat</option>
                            <option value="repeat-x">Repeat X</option><option value="repeat-y">Repeat Y</option>
                        </select>
                    </div>
                    <div class="se-row">
                        <label class="se-label">Overlay Color</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('background','overlayColor') || '#000000'"
                                (input)="updateBgProp('background','overlayColor',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('background','overlayColor') || ''"
                                (input)="updateBgProp('background','overlayColor',$any($event.target).value)" />
                        </div>
                    </div>
                    <div class="se-row">
                        <label class="se-label">Overlay Opacity</label>
                        <input type="number" class="se-input" min="0" max="1" step="0.05"
                            [value]="bgProp('background','overlayOpacity') ?? 0"
                            (input)="updateBgProp('background','overlayOpacity',toNum($event))" />
                    </div>
                }
            }

            @if (bgTab === 'hover') {
                <div class="se-row">
                    <label class="se-label">Type</label>
                    <select class="se-input" [value]="bgType('hoverBackground')"
                        (change)="updateBgType('hoverBackground', $any($event.target).value)">
                        <option value="none">None</option>
                        <option value="solid">Solid Color</option>
                        <option value="gradient">Gradient</option>
                    </select>
                </div>
                @if (bgType('hoverBackground') === 'solid') {
                    <div class="se-row">
                        <label class="se-label">Color</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('hoverBackground','color') || '#ffffff'"
                                (input)="updateBgProp('hoverBackground','color',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('hoverBackground','color') || ''"
                                placeholder="#ffffff" (input)="updateBgProp('hoverBackground','color',$any($event.target).value)" />
                        </div>
                    </div>
                }
                @if (bgType('hoverBackground') === 'gradient') {
                    <div class="se-row">
                        <label class="se-label">From</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('hoverBackground','gradientStart') || '#ffffff'"
                                (input)="updateBgProp('hoverBackground','gradientStart',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('hoverBackground','gradientStart') || ''"
                                (input)="updateBgProp('hoverBackground','gradientStart',$any($event.target).value)" />
                        </div>
                    </div>
                    <div class="se-row">
                        <label class="se-label">To</label>
                        <div class="color-row">
                            <input type="color" class="color-swatch" [value]="bgProp('hoverBackground','gradientEnd') || '#000000'"
                                (input)="updateBgProp('hoverBackground','gradientEnd',$any($event.target).value)" />
                            <input type="text" class="se-input" [value]="bgProp('hoverBackground','gradientEnd') || ''"
                                (input)="updateBgProp('hoverBackground','gradientEnd',$any($event.target).value)" />
                        </div>
                    </div>
                    <div class="se-row">
                        <label class="se-label">Angle (deg)</label>
                        <input type="number" class="se-input" min="0" max="360"
                            [value]="bgProp('hoverBackground','gradientAngle') ?? 135"
                            (input)="updateBgProp('hoverBackground','gradientAngle',toNum($event))" />
                    </div>
                }
            }

        </div>
    </details>

    <!-- ══════════════ BORDER ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Border</summary>
        <div class="se-group-body">

            <div class="se-row">
                <label class="se-label">Style</label>
                <select class="se-input" [value]="bs('borderStyle') || 'none'"
                    (change)="update('borderStyle', $any($event.target).value === 'none' ? undefined : $any($event.target).value)">
                    <option value="none">None</option><option value="solid">Solid</option>
                    <option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option>
                </select>
            </div>

            @if (bs('borderStyle') && bs('borderStyle') !== 'none') {
                <p class="se-sub">Width (px per side)</p>
                <div class="box-grid">
                    <div class="box-cell"><label>Top</label>
                        <input type="number" min="0" [value]="bs('borderTopWidth')" (input)="update('borderTopWidth', toNum($event))" />
                    </div>
                    <div class="box-cell"><label>Right</label>
                        <input type="number" min="0" [value]="bs('borderRightWidth')" (input)="update('borderRightWidth', toNum($event))" />
                    </div>
                    <div class="box-cell"><label>Bottom</label>
                        <input type="number" min="0" [value]="bs('borderBottomWidth')" (input)="update('borderBottomWidth', toNum($event))" />
                    </div>
                    <div class="box-cell"><label>Left</label>
                        <input type="number" min="0" [value]="bs('borderLeftWidth')" (input)="update('borderLeftWidth', toNum($event))" />
                    </div>
                </div>

                <div class="se-row" style="margin-top:10px">
                    <label class="se-label">Color</label>
                    <div class="color-row">
                        <input type="color" class="color-swatch" [value]="bs('borderColor') || '#d1d5db'"
                            (input)="update('borderColor', $any($event.target).value)" />
                        <input type="text" class="se-input" [value]="bs('borderColor') || ''"
                            placeholder="#d1d5db" (input)="update('borderColor', $any($event.target).value)" />
                    </div>
                </div>

                <div class="se-row">
                    <label class="se-label">Hover Color</label>
                    <div class="color-row">
                        <input type="color" class="color-swatch" [value]="bs('hoverBorderColor') || '#000000'"
                            (input)="update('hoverBorderColor', $any($event.target).value)" />
                        <input type="text" class="se-input" [value]="bs('hoverBorderColor') || ''"
                            placeholder="none" (input)="update('hoverBorderColor', $any($event.target).value || undefined)" />
                    </div>
                </div>
            }

            <p class="se-sub" style="margin-top:10px">Radius (px per corner)</p>
            <div class="box-grid">
                <div class="box-cell"><label>TL</label>
                    <input type="number" min="0" [value]="bs('borderRadiusTL')" (input)="update('borderRadiusTL', toNum($event))" />
                </div>
                <div class="box-cell"><label>TR</label>
                    <input type="number" min="0" [value]="bs('borderRadiusTR')" (input)="update('borderRadiusTR', toNum($event))" />
                </div>
                <div class="box-cell"><label>BR</label>
                    <input type="number" min="0" [value]="bs('borderRadiusBR')" (input)="update('borderRadiusBR', toNum($event))" />
                </div>
                <div class="box-cell"><label>BL</label>
                    <input type="number" min="0" [value]="bs('borderRadiusBL')" (input)="update('borderRadiusBL', toNum($event))" />
                </div>
            </div>

        </div>
    </details>

    <!-- ══════════════ SHADOW ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Shadow</summary>
        <div class="se-group-body">

            <p class="se-sub">Box Shadow</p>
            <div class="shadow-presets">
                <button (click)="update('boxShadow', undefined)">None</button>
                <button (click)="update('boxShadow', '0 1px 3px rgba(0,0,0,0.1)')">Soft</button>
                <button (click)="update('boxShadow', '0 4px 12px rgba(0,0,0,0.15)')">Medium</button>
                <button (click)="update('boxShadow', '0 8px 30px rgba(0,0,0,0.25)')">Strong</button>
                <button (click)="update('boxShadow', 'inset 0 2px 6px rgba(0,0,0,0.12)')">Inset</button>
            </div>
            <input type="text" class="se-input" style="margin-top:6px;width:100%;box-sizing:border-box"
                [value]="bs('boxShadow') || ''" placeholder="h v blur spread color"
                (input)="update('boxShadow', $any($event.target).value || undefined)" />

            <p class="se-sub" style="margin-top:10px">Box Shadow on Hover</p>
            <input type="text" class="se-input" style="width:100%;box-sizing:border-box"
                [value]="bs('hoverBoxShadow') || ''" placeholder="h v blur spread color"
                (input)="update('hoverBoxShadow', $any($event.target).value || undefined)" />

            <p class="se-sub" style="margin-top:10px">Text Shadow</p>
            <div class="shadow-presets">
                <button (click)="update('textShadow', undefined)">None</button>
                <button (click)="update('textShadow', '1px 1px 2px rgba(0,0,0,0.3)')">Light</button>
                <button (click)="update('textShadow', '2px 2px 6px rgba(0,0,0,0.5)')">Strong</button>
            </div>
            <input type="text" class="se-input" style="margin-top:6px;width:100%;box-sizing:border-box"
                [value]="bs('textShadow') || ''" placeholder="h v blur color"
                (input)="update('textShadow', $any($event.target).value || undefined)" />

        </div>
    </details>

    <!-- ══════════════ TYPOGRAPHY ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Typography</summary>
        <div class="se-group-body">

            <div class="se-row">
                <label class="se-label">Font Family</label>
                <input type="text" class="se-input" [value]="bs('fontFamily') || ''"
                    placeholder="Arial, sans-serif"
                    (input)="update('fontFamily', $any($event.target).value || undefined)" />
            </div>
            <div class="se-row">
                <label class="se-label">Size</label>
                <div class="input-unit">
                    <input type="number" min="1" [value]="bs('fontSize')" (input)="update('fontSize', toNum($event))" />
                    <select [value]="bs('fontSizeUnit') || 'px'" (change)="update('fontSizeUnit', $any($event.target).value)">
                        <option>px</option><option>em</option><option>rem</option>
                    </select>
                </div>
            </div>
            <div class="se-row">
                <label class="se-label">Weight</label>
                <select class="se-input" [value]="bs('fontWeight') || ''"
                    (change)="update('fontWeight', $any($event.target).value || undefined)">
                    <option value="">Default</option>
                    <option value="100">Thin (100)</option><option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option><option value="500">Medium (500)</option>
                    <option value="600">Semi-Bold (600)</option><option value="700">Bold (700)</option>
                    <option value="800">Extra-Bold (800)</option><option value="900">Black (900)</option>
                </select>
            </div>
            <div class="se-row">
                <label class="se-label">Style</label>
                <select class="se-input" [value]="bs('fontStyle') || 'normal'"
                    (change)="update('fontStyle', $any($event.target).value === 'normal' ? undefined : $any($event.target).value)">
                    <option value="normal">Normal</option><option value="italic">Italic</option><option value="oblique">Oblique</option>
                </select>
            </div>
            <div class="se-row">
                <label class="se-label">Transform</label>
                <select class="se-input" [value]="bs('textTransform') || 'none'"
                    (change)="update('textTransform', $any($event.target).value === 'none' ? undefined : $any($event.target).value)">
                    <option value="none">None</option><option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option><option value="capitalize">Capitalize</option>
                </select>
            </div>
            <div class="se-row">
                <label class="se-label">Decoration</label>
                <select class="se-input" [value]="bs('textDecoration') || 'none'"
                    (change)="update('textDecoration', $any($event.target).value === 'none' ? undefined : $any($event.target).value)">
                    <option value="none">None</option><option value="underline">Underline</option>
                    <option value="overline">Overline</option><option value="line-through">Line-through</option>
                </select>
            </div>
            <div class="se-row">
                <label class="se-label">Align</label>
                <div class="align-btns">
                    <button [class.active]="bs('textAlign') === 'left'" (click)="update('textAlign','left')" title="Left"><i class="pi pi-align-left"></i></button>
                    <button [class.active]="bs('textAlign') === 'center'" (click)="update('textAlign','center')" title="Center"><i class="pi pi-align-center"></i></button>
                    <button [class.active]="bs('textAlign') === 'right'" (click)="update('textAlign','right')" title="Right"><i class="pi pi-align-right"></i></button>
                    <button [class.active]="bs('textAlign') === 'justify'" (click)="update('textAlign','justify')" title="Justify"><i class="pi pi-align-justify"></i></button>
                </div>
            </div>
            <div class="se-row">
                <label class="se-label">Line Height</label>
                <input type="number" class="se-input" min="0" step="0.1" [value]="bs('lineHeight')"
                    placeholder="1.5" (input)="update('lineHeight', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Letter Sp. (em)</label>
                <input type="number" class="se-input" step="0.01" [value]="bs('letterSpacing')"
                    placeholder="0" (input)="update('letterSpacing', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Word Sp. (px)</label>
                <input type="number" class="se-input" step="1" [value]="bs('wordSpacing')"
                    placeholder="0" (input)="update('wordSpacing', toNum($event))" />
            </div>

        </div>
    </details>

    <!-- ══════════════ DIMENSIONS ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Dimensions</summary>
        <div class="se-group-body">

            <div class="se-row">
                <label class="se-label">Width</label>
                <input type="text" class="se-input" [value]="bs('width') || ''"
                    placeholder="auto / 100% / 300px"
                    (input)="update('width', $any($event.target).value || undefined)" />
            </div>
            <div class="se-row">
                <label class="se-label">Max Width</label>
                <input type="text" class="se-input" [value]="bs('maxWidth') || ''"
                    placeholder="none / 1200px"
                    (input)="update('maxWidth', $any($event.target).value || undefined)" />
            </div>
            <div class="se-row">
                <label class="se-label">Min Height</label>
                <div class="input-unit">
                    <input type="number" min="0" [value]="bs('minHeight')" (input)="update('minHeight', toNum($event))" />
                    <select [value]="bs('minHeightUnit') || 'px'" (change)="update('minHeightUnit', $any($event.target).value)">
                        <option>px</option><option>vh</option><option>em</option><option>rem</option>
                    </select>
                </div>
            </div>
            <div class="se-row">
                <label class="se-label">Z-Index</label>
                <input type="number" class="se-input" [value]="bs('zIndex')"
                    placeholder="auto" (input)="update('zIndex', toNum($event))" />
            </div>

        </div>
    </details>

    <!-- ══════════════ POSITION ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Position</summary>
        <div class="se-group-body">

            <div class="se-row">
                <label class="se-label">Type</label>
                <select class="se-input" [value]="bs('positionType') || 'default'"
                    (change)="update('positionType', $any($event.target).value === 'default' ? undefined : $any($event.target).value)">
                    <option value="default">Default</option>
                    <option value="relative">Relative</option>
                    <option value="absolute">Absolute</option>
                    <option value="fixed">Fixed</option>
                </select>
            </div>

            @if (bs('positionType') && bs('positionType') !== 'default') {
                <div class="box-grid">
                    <div class="box-cell"><label>Top</label>
                        <div class="input-unit">
                            <input type="number" [value]="bs('positionTop')" (input)="update('positionTop', toNum($event))" />
                            <select [value]="bs('positionTopUnit') || 'px'" (change)="update('positionTopUnit', $any($event.target).value)">
                                <option>px</option><option>%</option><option>em</option>
                            </select>
                        </div>
                    </div>
                    <div class="box-cell"><label>Right</label>
                        <div class="input-unit">
                            <input type="number" [value]="bs('positionRight')" (input)="update('positionRight', toNum($event))" />
                            <select [value]="bs('positionRightUnit') || 'px'" (change)="update('positionRightUnit', $any($event.target).value)">
                                <option>px</option><option>%</option><option>em</option>
                            </select>
                        </div>
                    </div>
                    <div class="box-cell"><label>Bottom</label>
                        <div class="input-unit">
                            <input type="number" [value]="bs('positionBottom')" (input)="update('positionBottom', toNum($event))" />
                            <select [value]="bs('positionBottomUnit') || 'px'" (change)="update('positionBottomUnit', $any($event.target).value)">
                                <option>px</option><option>%</option><option>em</option>
                            </select>
                        </div>
                    </div>
                    <div class="box-cell"><label>Left</label>
                        <div class="input-unit">
                            <input type="number" [value]="bs('positionLeft')" (input)="update('positionLeft', toNum($event))" />
                            <select [value]="bs('positionLeftUnit') || 'px'" (change)="update('positionLeftUnit', $any($event.target).value)">
                                <option>px</option><option>%</option><option>em</option>
                            </select>
                        </div>
                    </div>
                </div>
            }

        </div>
    </details>

    <!-- ══════════════ TRANSFORM ══════════════ -->
    <details class="se-group">
        <summary class="se-group-title">Transform</summary>
        <div class="se-group-body">

            <div class="se-row">
                <label class="se-label">Rotate (deg)</label>
                <input type="number" class="se-input" step="1" [value]="bs('transformRotate') ?? 0"
                    (input)="update('transformRotate', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Scale X</label>
                <input type="number" class="se-input" step="0.05" [value]="bs('transformScaleX') ?? 1"
                    (input)="update('transformScaleX', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Scale Y</label>
                <input type="number" class="se-input" step="0.05" [value]="bs('transformScaleY') ?? 1"
                    (input)="update('transformScaleY', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Skew X (deg)</label>
                <input type="number" class="se-input" step="1" [value]="bs('transformSkewX') ?? 0"
                    (input)="update('transformSkewX', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Skew Y (deg)</label>
                <input type="number" class="se-input" step="1" [value]="bs('transformSkewY') ?? 0"
                    (input)="update('transformSkewY', toNum($event))" />
            </div>
            <div class="se-row">
                <label class="se-label">Translate X</label>
                <div class="input-unit">
                    <input type="number" [value]="bs('transformTranslateX') ?? 0"
                        (input)="update('transformTranslateX', toNum($event))" />
                    <select [value]="bs('transformTranslateXUnit') || 'px'"
                        (change)="update('transformTranslateXUnit', $any($event.target).value)">
                        <option>px</option><option>%</option><option>em</option>
                    </select>
                </div>
            </div>
            <div class="se-row">
                <label class="se-label">Translate Y</label>
                <div class="input-unit">
                    <input type="number" [value]="bs('transformTranslateY') ?? 0"
                        (input)="update('transformTranslateY', toNum($event))" />
                    <select [value]="bs('transformTranslateYUnit') || 'px'"
                        (change)="update('transformTranslateYUnit', $any($event.target).value)">
                        <option>px</option><option>%</option><option>em</option>
                    </select>
                </div>
            </div>

        </div>
    </details>

</div>
    `,
    styles: [`
        :host { display: block; }
        .se { padding: 0; }

        .se-group { border-bottom: 1px solid #e5e7eb; }
        .se-group-title {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 16px; font-size: 11px; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.05em;
            color: #374151; cursor: pointer; user-select: none; list-style: none;
        }
        .se-group-title::-webkit-details-marker { display: none; }
        .se-group-title::after { content: '▸'; font-size: 10px; color: #9ca3af; }
        details[open] > .se-group-title::after { content: '▾'; }
        .se-group-body { padding: 10px 16px 14px; }

        .se-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .se-label { flex-shrink: 0; width: 92px; font-size: 12px; color: #6b7280; }
        .se-sub { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px 0; }

        .se-input, input[type=number], input[type=text] {
            flex: 1; min-width: 0; padding: 4px 7px; font-size: 12px;
            border: 1px solid #d1d5db; border-radius: 4px; background: #fff; color: #111827; outline: none;
        }
        .se-input:focus, input:focus { border-color: #2563eb; }
        select.se-input { cursor: pointer; }

        .input-unit { display: flex; flex: 1; gap: 3px; }
        .input-unit input { flex: 1; min-width: 0; }
        .input-unit select { width: 48px; flex-shrink: 0; font-size: 11px; padding: 4px 2px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; }

        .box-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
        .box-cell { display: flex; flex-direction: column; gap: 2px; }
        .box-cell label { font-size: 10px; color: #9ca3af; text-align: center; }
        .box-cell input { text-align: center; width: 100%; box-sizing: border-box; padding: 4px 3px; }
        .box-cell .input-unit select { width: 38px; font-size: 10px; padding: 3px 1px; }

        .color-row { display: flex; flex: 1; gap: 6px; align-items: center; }
        .color-swatch { width: 28px; height: 28px; padding: 0; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; flex-shrink: 0; }

        .align-btns { display: flex; gap: 4px; }
        .align-btns button {
            width: 30px; height: 28px; border: 1px solid #d1d5db; border-radius: 4px;
            background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            color: #6b7280; font-size: 13px;
        }
        .align-btns button.active { background: #eff6ff; border-color: #2563eb; color: #2563eb; }

        .shadow-presets { display: flex; gap: 5px; flex-wrap: wrap; }
        .shadow-presets button {
            padding: 3px 9px; font-size: 11px; border: 1px solid #d1d5db; border-radius: 20px;
            background: #fff; cursor: pointer; color: #374151;
        }
        .shadow-presets button:hover { background: #f3f4f6; }

        .sub-tabs { display: flex; margin-bottom: 10px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
        .sub-tab {
            flex: 1; padding: 5px 0; font-size: 12px; border: none; background: #f9fafb; cursor: pointer; color: #6b7280;
        }
        .sub-tab.active { background: #fff; color: #2563eb; font-weight: 600; }
    `]
})
export class BlockStyleEditorComponent implements OnChanges {
    @Input() block!: BlockNode;
    bgTab: 'normal' | 'hover' = 'normal';

    private readonly store = inject(PageDocumentStore);

    ngOnChanges(_changes: SimpleChanges): void {}

    widgetStyleFields(): WidgetStyleField[] {
        const settings = this.block?.settings ?? {};
        return Object.entries(settings)
            .filter(([key, value]) => this.isWidgetStyleSetting(key, value))
            .map(([key, value]) => ({
                key,
                label: this.prettyLabel(key),
                kind: this.styleFieldKind(key, value),
                value
            }));
    }

    bs(key: keyof BlockStyles): any {
        return (this.block?.blockStyles as any)?.[key];
    }

    bgType(field: 'background' | 'hoverBackground'): string {
        return (this.block?.blockStyles?.[field] as BackgroundValue | undefined)?.type ?? 'none';
    }

    bgProp(field: 'background' | 'hoverBackground', key: keyof BackgroundValue): any {
        return (this.block?.blockStyles?.[field] as any)?.[key];
    }

    update(key: keyof BlockStyles, value: any): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const next = { ...prev, [key]: value };
        if (value === undefined || value === null || value === '') {
            delete (next as any)[key];
        }
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, next, prev));
    }

    updateWidgetSetting(key: string, value: unknown): void {
        const previousSettings = structuredClone(this.block.settings ?? {}) as Record<string, unknown>;
        const nextSettings = { ...previousSettings };
        if (value === undefined || value === null || value === '') {
            delete nextSettings[key];
        } else {
            nextSettings[key] = value;
        }
        this.store.dispatch(new UpdateBlockSettingsCommand(this.block.id, nextSettings, previousSettings));
    }

    updateBgType(field: 'background' | 'hoverBackground', type: string): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const next: BlockStyles = { ...prev };
        if (type === 'none' || !type) {
            delete (next as any)[field];
        } else {
            next[field] = { ...(prev[field] ?? {}), type } as BackgroundValue;
        }
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, next, prev));
    }

    updateBgProp(field: 'background' | 'hoverBackground', key: keyof BackgroundValue, value: any): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const existingBg = ((prev[field] ?? { type: 'solid' }) as BackgroundValue);
        const next: BlockStyles = { ...prev, [field]: { ...existingBg, [key]: value } };
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, next, prev));
    }

    toNum(event: Event): number | undefined {
        const val = (event as any)?.target?.value;
        const n = parseFloat(val);
        return isNaN(n) ? undefined : n;
    }

    asColor(value: unknown): string {
        return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#000000';
    }

    private isWidgetStyleSetting(key: string, value: unknown): boolean {
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return false;
        if (typeof value === 'object') return false;

        return /(color|background|padding|margin|border|radius|shadow|opacity|font|align|style|appearance|size)$/i.test(key)
            || /(color|background|padding|margin|border|radius|shadow|opacity|font|align|style|appearance)/i.test(key);
    }

    private styleFieldKind(key: string, value: unknown): WidgetStyleField['kind'] {
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string' && (/(color|background)/i.test(key) || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value))) {
            return 'color';
        }
        return 'text';
    }

    private prettyLabel(key: string): string {
        return key
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
}
