import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageDocumentStore } from '../core/page-document.store';
import { BlockNode, BlockStyles, VisibilityConfig } from '../core/document.model';
import { UpdateBlockStylesCommand, UpdateBlockVisibilityCommand } from '../core/commands/commands';

@Component({
    selector: 'app-block-advanced-editor',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="adv-editor">

            <!-- CSS Class -->
            <div class="adv-section">
                <p class="adv-title">CSS Class</p>
                <div class="adv-row">
                    <input
                        type="text"
                        class="adv-input"
                        [value]="block?.blockStyles?.cssClass || ''"
                        placeholder="my-class another-class"
                        (input)="updateStyle('cssClass', $any($event.target).value || undefined)"
                    />
                </div>
                <p class="adv-hint">Space-separated class names added to the block wrapper.</p>
            </div>

            <!-- Custom CSS -->
            <div class="adv-section">
                <p class="adv-title">Custom CSS</p>
                <textarea
                    class="adv-textarea"
                    rows="8"
                    [value]="block?.blockStyles?.customCss || ''"
                    placeholder="& {&#10;  color: red;&#10;}&#10;&#10;& h2 {&#10;  font-size: 28px;&#10;}"
                    (input)="updateStyle('customCss', $any($event.target).value || undefined)"
                ></textarea>
                <p class="adv-hint">Use <code>&amp;</code> as the self-selector. It maps to this block's unique ID in the final output.</p>
            </div>

            <!-- Visibility -->
            <div class="adv-section">
                <p class="adv-title">Responsive Visibility</p>
                <div class="adv-toggle-row">
                    <span class="adv-toggle-label">
                        <i class="pi pi-desktop"></i>
                        Hide on Desktop
                    </span>
                    <label class="adv-toggle">
                        <input type="checkbox"
                            [checked]="block?.visibility?.hideOnDesktop || false"
                            (change)="updateVisibility('hideOnDesktop', $any($event.target).checked)"
                        />
                        <span class="adv-toggle-track"></span>
                    </label>
                </div>
                <div class="adv-toggle-row">
                    <span class="adv-toggle-label">
                        <i class="pi pi-tablet"></i>
                        Hide on Tablet
                    </span>
                    <label class="adv-toggle">
                        <input type="checkbox"
                            [checked]="block?.visibility?.hideOnTablet || false"
                            (change)="updateVisibility('hideOnTablet', $any($event.target).checked)"
                        />
                        <span class="adv-toggle-track"></span>
                    </label>
                </div>
                <div class="adv-toggle-row">
                    <span class="adv-toggle-label">
                        <i class="pi pi-mobile"></i>
                        Hide on Mobile
                    </span>
                    <label class="adv-toggle">
                        <input type="checkbox"
                            [checked]="block?.visibility?.hideOnMobile || false"
                            (change)="updateVisibility('hideOnMobile', $any($event.target).checked)"
                        />
                        <span class="adv-toggle-track"></span>
                    </label>
                </div>
            </div>

            <!-- Animation -->
            <div class="adv-section">
                <p class="adv-title">Animation</p>
                <div class="adv-toggle-row">
                    <span class="adv-toggle-label">Enable Animation</span>
                    <label class="adv-toggle">
                        <input type="checkbox"
                            [checked]="block?.blockStyles?.animationEnabled || false"
                            (change)="updateStyle('animationEnabled', $any($event.target).checked)"
                        />
                        <span class="adv-toggle-track"></span>
                    </label>
                </div>
                @if (block?.blockStyles?.animationEnabled) {
                    <div class="adv-row">
                        <label class="adv-label">Type</label>
                        <select class="adv-input" [value]="block?.blockStyles?.animationType || 'fade-in'"
                            (change)="updateStyle('animationType', $any($event.target).value)">
                            <option value="fade-in">Fade In</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-left">Slide Left</option>
                            <option value="slide-right">Slide Right</option>
                            <option value="scale">Scale</option>
                            <option value="bounce">Bounce</option>
                        </select>
                    </div>
                    <div class="adv-row">
                        <label class="adv-label">Duration (ms)</label>
                        <input type="number" class="adv-input" min="100" max="3000" step="50"
                            [value]="block?.blockStyles?.animationDuration ?? 600"
                            (input)="updateStyle('animationDuration', toNum($event))"
                        />
                    </div>
                    <div class="adv-row">
                        <label class="adv-label">Delay (ms)</label>
                        <input type="number" class="adv-input" min="0" max="3000" step="50"
                            [value]="block?.blockStyles?.animationDelay ?? 0"
                            (input)="updateStyle('animationDelay', toNum($event))"
                        />
                    </div>
                }
            </div>

            <!-- Scroll Motion -->
            <div class="adv-section">
                <p class="adv-title">Scroll Motion</p>
                <div class="adv-row">
                    <label class="adv-label">Parallax (px)</label>
                    <input type="number" class="adv-input" step="10"
                        [value]="block?.blockStyles?.motionScrollParallax ?? 0"
                        placeholder="0"
                        (input)="updateStyle('motionScrollParallax', toNum($event))" />
                </div>
                <div class="adv-row">
                    <label class="adv-label">Opacity From</label>
                    <input type="number" class="adv-input" min="0" max="1" step="0.05"
                        [value]="block?.blockStyles?.motionScrollOpacityFrom ?? 1"
                        (input)="updateStyle('motionScrollOpacityFrom', toNum($event))" />
                </div>
                <div class="adv-row">
                    <label class="adv-label">Opacity To</label>
                    <input type="number" class="adv-input" min="0" max="1" step="0.05"
                        [value]="block?.blockStyles?.motionScrollOpacityTo ?? 1"
                        (input)="updateStyle('motionScrollOpacityTo', toNum($event))" />
                </div>
                <div class="adv-row">
                    <label class="adv-label">Scale From</label>
                    <input type="number" class="adv-input" min="0.1" max="3" step="0.05"
                        [value]="block?.blockStyles?.motionScrollScaleFrom ?? 1"
                        (input)="updateStyle('motionScrollScaleFrom', toNum($event))" />
                </div>
                <div class="adv-row">
                    <label class="adv-label">Scale To</label>
                    <input type="number" class="adv-input" min="0.1" max="3" step="0.05"
                        [value]="block?.blockStyles?.motionScrollScaleTo ?? 1"
                        (input)="updateStyle('motionScrollScaleTo', toNum($event))" />
                </div>
                <div class="adv-row">
                    <label class="adv-label">Blur (px)</label>
                    <input type="number" class="adv-input" min="0" max="20" step="1"
                        [value]="block?.blockStyles?.motionScrollBlur ?? 0"
                        (input)="updateStyle('motionScrollBlur', toNum($event))" />
                </div>
                <p class="adv-hint">Scroll motion effects are processed at render time via a Intersection Observer script.</p>
            </div>

            <!-- Custom HTML Attributes -->
            <div class="adv-section">
                <p class="adv-title">Custom HTML Attributes</p>
                @for (attr of htmlAttrs; track $index) {
                    <div class="adv-attr-row">
                        <input type="text" class="adv-input" [value]="attr.key"
                            placeholder="data-id / aria-label"
                            (input)="updateAttrKey($index, $any($event.target).value)" />
                        <input type="text" class="adv-input" [value]="attr.value"
                            placeholder="value"
                            (input)="updateAttrValue($index, $any($event.target).value)" />
                        <button class="adv-attr-remove" (click)="removeAttr($index)">×</button>
                    </div>
                }
                <button class="adv-attr-add" (click)="addAttr()">+ Add Attribute</button>
                <p class="adv-hint">Add custom <code>data-*</code> or <code>aria-*</code> attributes to the block's wrapper element.</p>
            </div>

        </div>
    `,
    styles: [`
        :host { display: block; height: 100%; overflow-y: auto; }

        .adv-editor { padding: 12px 14px; display: flex; flex-direction: column; gap: 0; }

        .adv-section {
            padding-bottom: 16px;
            margin-bottom: 4px;
            border-bottom: 1px solid #f3f4f6;
        }
        .adv-section:last-child { border-bottom: none; }

        .adv-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin: 0 0 10px;
        }

        .adv-hint {
            font-size: 11px;
            color: #9ca3af;
            margin: 4px 0 0;
            line-height: 1.5;
        }
        .adv-hint code {
            font-family: monospace;
            background: #f3f4f6;
            padding: 1px 4px;
            border-radius: 3px;
        }

        .adv-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 7px;
        }

        .adv-label {
            font-size: 12px;
            color: #374151;
            min-width: 90px;
            flex-shrink: 0;
        }

        .adv-input {
            flex: 1;
            padding: 4px 8px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            font-size: 12px;
            color: #111827;
            outline: none;
            background: white;
            min-width: 0;
        }
        .adv-input:focus { border-color: #2563eb; }

        .adv-textarea {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            font-size: 12px;
            font-family: monospace;
            color: #111827;
            outline: none;
            background: white;
            resize: vertical;
            box-sizing: border-box;
        }
        .adv-textarea:focus { border-color: #2563eb; }

        /* Attr repeater */
        .adv-attr-row { display: flex; gap: 5px; margin-bottom: 6px; align-items: center; }
        .adv-attr-remove {
            width: 24px; height: 24px; flex-shrink: 0; border: 1px solid #fca5a5;
            border-radius: 4px; background: #fff; color: #ef4444; font-size: 16px;
            line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .adv-attr-remove:hover { background: #fef2f2; }
        .adv-attr-add {
            padding: 4px 10px; font-size: 12px; border: 1px dashed #d1d5db;
            border-radius: 5px; background: #f9fafb; color: #374151; cursor: pointer; margin-top: 2px;
        }
        .adv-attr-add:hover { background: #f3f4f6; border-color: #2563eb; color: #2563eb; }

        /* Toggle row */
        .adv-toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .adv-toggle-label {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 13px;
            color: #374151;
        }
        .adv-toggle-label i { color: #6b7280; font-size: 14px; }

        .adv-toggle {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
            flex-shrink: 0;
        }
        .adv-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .adv-toggle-track {
            position: absolute;
            inset: 0;
            background: #d1d5db;
            border-radius: 20px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .adv-toggle-track::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .adv-toggle input:checked + .adv-toggle-track { background: #2563eb; }
        .adv-toggle input:checked + .adv-toggle-track::after { transform: translateX(16px); }
    `]
})
export class BlockAdvancedEditorComponent implements OnChanges {
    @Input() block!: BlockNode;

    private readonly store = inject(PageDocumentStore);

    ngOnChanges(_changes: SimpleChanges): void {
        // Intentionally empty — we read from block input directly
    }

    updateStyle(key: keyof BlockStyles, value: any): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const next = { ...prev, [key]: value };
        if (value === undefined || value === null || value === '') {
            delete (next as any)[key];
        }
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, next, prev));
    }

    updateVisibility(key: keyof VisibilityConfig, value: boolean): void {
        const prev: VisibilityConfig = structuredClone(this.block.visibility ?? {});
        const next: VisibilityConfig = { ...prev, [key]: value || undefined };
        if (!value) delete (next as any)[key];
        this.store.dispatch(new UpdateBlockVisibilityCommand(this.block.id, next, prev));
    }

    get htmlAttrs(): { key: string; value: string }[] {
        return this.block?.blockStyles?.htmlAttributes ?? [];
    }

    addAttr(): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const attrs = [...(prev.htmlAttributes ?? []), { key: '', value: '' }];
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, { ...prev, htmlAttributes: attrs }, prev));
    }

    removeAttr(index: number): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const attrs = [...(prev.htmlAttributes ?? [])];
        attrs.splice(index, 1);
        const next: BlockStyles = { ...prev, htmlAttributes: attrs.length ? attrs : undefined };
        if (!attrs.length) delete next.htmlAttributes;
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, next, prev));
    }

    updateAttrKey(index: number, key: string): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const attrs = [...(prev.htmlAttributes ?? [])];
        attrs[index] = { ...attrs[index], key };
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, { ...prev, htmlAttributes: attrs }, prev));
    }

    updateAttrValue(index: number, value: string): void {
        const prev = structuredClone(this.block.blockStyles ?? {}) as BlockStyles;
        const attrs = [...(prev.htmlAttributes ?? [])];
        attrs[index] = { ...attrs[index], value };
        this.store.dispatch(new UpdateBlockStylesCommand(this.block.id, { ...prev, htmlAttributes: attrs }, prev));
    }

    toNum(event: Event): number | undefined {
        const val = (event as any)?.target?.value;
        const n = parseFloat(val);
        return isNaN(n) ? undefined : n;
    }
}
