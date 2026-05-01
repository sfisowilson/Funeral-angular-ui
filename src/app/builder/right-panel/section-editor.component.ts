import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SectionNode, SectionSettings } from '../core/document.model';

@Component({
    selector: 'app-section-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="onApply()" class="section-form">

            @if (activeTab === 'style') {
                <!-- Background -->
                <div class="form-section">
                    <p class="form-section-title">Background</p>

                    <div class="form-row">
                        <label class="form-label">Type</label>
                        <select formControlName="bgType" class="form-control">
                            <option value="none">None</option>
                            <option value="solid">Solid Color</option>
                            <option value="gradient">Gradient</option>
                            <option value="image">Image</option>
                        </select>
                    </div>

                @if (form.get('bgType')?.value === 'solid') {
                    <div class="form-row">
                        <label class="form-label">Color</label>
                        <div class="color-row">
                            <input type="color" formControlName="bgColor" class="color-swatch" />
                            <input type="text" formControlName="bgColor" class="form-control" placeholder="#ffffff" />
                        </div>
                    </div>
                }

                @if (form.get('bgType')?.value === 'gradient') {
                    <div class="form-row">
                        <label class="form-label">From</label>
                        <div class="color-row">
                            <input type="color" formControlName="gradientStart" class="color-swatch" />
                            <input type="text" formControlName="gradientStart" class="form-control" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label">To</label>
                        <div class="color-row">
                            <input type="color" formControlName="gradientEnd" class="color-swatch" />
                            <input type="text" formControlName="gradientEnd" class="form-control" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Angle (°)</label>
                        <input type="number" formControlName="gradientAngle" class="form-control" min="0" max="360" />
                    </div>
                }

                @if (form.get('bgType')?.value === 'image') {
                    <div class="form-row">
                        <label class="form-label">Image URL</label>
                        <input type="text" formControlName="imageUrl" class="form-control" placeholder="https://..." />
                    </div>
                    <div class="form-row">
                        <label class="form-label">Size</label>
                        <select formControlName="imageSize" class="form-control">
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Position</label>
                        <input type="text" formControlName="imagePosition" class="form-control" placeholder="center" />
                    </div>
                    <div class="form-row">
                        <label class="form-label">Repeat</label>
                        <select formControlName="imageRepeat" class="form-control">
                            <option value="no-repeat">No Repeat</option>
                            <option value="repeat">Repeat</option>
                            <option value="repeat-x">Repeat X</option>
                            <option value="repeat-y">Repeat Y</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Overlay</label>
                        <div class="color-row">
                            <input type="color" formControlName="overlayColor" class="color-swatch" />
                            <input type="text" formControlName="overlayColor" class="form-control" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Opacity</label>
                        <input type="number" formControlName="overlayOpacity" class="form-control" min="0" max="1" step="0.05" />
                    </div>
                }
                </div>
            }

            @if (activeTab === 'layout') {
                <!-- Padding -->
                <div class="form-section">
                    <p class="form-section-title">Padding (px)</p>
                    <div class="padding-grid">
                        <div class="padding-cell">
                            <label>Top</label>
                            <input type="number" formControlName="paddingTop" class="form-control sm" min="0" />
                        </div>
                    <div class="padding-cell">
                        <label>Right</label>
                        <input type="number" formControlName="paddingRight" class="form-control sm" min="0" />
                    </div>
                    <div class="padding-cell">
                        <label>Bottom</label>
                        <input type="number" formControlName="paddingBottom" class="form-control sm" min="0" />
                    </div>
                    <div class="padding-cell">
                        <label>Left</label>
                        <input type="number" formControlName="paddingLeft" class="form-control sm" min="0" />
                    </div>
                </div>
            </div>

            <!-- Layout -->
            <div class="form-section">
                <p class="form-section-title">Layout Constraints</p>
                <div class="form-row">
                    <label class="form-label">Min Height (px)</label>
                    <input type="number" formControlName="minHeight" class="form-control" min="0" placeholder="auto" />
                </div>
                <div class="form-row">
                    <label class="form-label">Max Width (px)</label>
                    <input type="number" formControlName="containerMaxWidth" class="form-control" min="0" placeholder="none" />
                </div>
                <div class="form-row form-row--checkbox">
                    <label class="form-label">Full Width</label>
                    <input type="checkbox" formControlName="fullWidth" class="form-checkbox" />
                </div>
            </div>
            }

            @if (activeTab === 'advanced') {
            <!-- Advanced -->
            <div class="form-section">
                <p class="form-section-title">Advanced Properties</p>
                <div class="form-row">
                    <label class="form-label">CSS Class</label>
                    <input type="text" formControlName="cssClass" class="form-control" placeholder="my-section" />
                </div>
                <div class="form-row">
                    <label class="form-label">Anchor ID</label>
                    <input type="text" formControlName="anchorId" class="form-control" placeholder="about-us" />
                </div>
            </div>
            }

            <!-- Actions -->
            <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="onReset()">Reset</button>
                <button type="submit" class="btn-primary">Apply</button>
            </div>

        </form>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                overflow-y: auto;
            }

            .section-form {
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            /* Form section */
            .form-section {
                padding-bottom: 16px;
                margin-bottom: 4px;
                border-bottom: 1px solid #f3f4f6;
            }

            .form-section:last-of-type {
                border-bottom: none;
            }

            .form-section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #6b7280;
                margin: 0 0 10px;
            }

            /* Form row */
            .form-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .form-row--checkbox {
                justify-content: space-between;
            }

            .form-label {
                font-size: 12px;
                color: #374151;
                min-width: 80px;
                flex-shrink: 0;
            }

            .form-control {
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

            .form-control:focus {
                border-color: #2563eb;
            }

            .form-control.sm {
                padding: 4px 6px;
            }

            .form-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }

            /* Color row */
            .color-row {
                display: flex;
                align-items: center;
                gap: 6px;
                flex: 1;
                min-width: 0;
            }

            .color-swatch {
                width: 28px;
                height: 28px;
                padding: 2px;
                border: 1px solid #e5e7eb;
                border-radius: 5px;
                cursor: pointer;
                flex-shrink: 0;
                background: none;
            }

            /* Padding grid */
            .padding-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .padding-cell {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }

            .padding-cell label {
                font-size: 11px;
                color: #6b7280;
            }

            .padding-cell .form-control {
                flex: none;
                width: 100%;
            }

            /* Actions */
            .form-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                padding-top: 12px;
            }

            .btn-primary {
                padding: 6px 16px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                font-weight: 500;
            }

            .btn-primary:hover {
                background: #1d4ed8;
            }

            .btn-secondary {
                padding: 6px 12px;
                background: white;
                color: #374151;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
            }

            .btn-secondary:hover {
                border-color: #9ca3af;
            }
        `
    ]
})
export class SectionEditorComponent implements OnInit, OnChanges {
    @Input() section!: SectionNode;
    @Input() activeTab: 'layout' | 'style' | 'advanced' = 'layout';
    @Output() update = new EventEmitter<SectionSettings>();

    private readonly fb = inject(FormBuilder);
    form!: FormGroup;

    ngOnInit(): void {
        this.buildForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['section'] && this.form) {
            this.patchForm();
        }
    }

    private buildForm(): void {
        const s = this.section?.settings ?? {};
        const bg = s.background;
        this.form = this.fb.group({
            bgType: [bg?.type ?? 'none'],
            bgColor: [bg?.color ?? '#ffffff'],
            gradientStart: [bg?.gradientStart ?? '#ffffff'],
            gradientEnd: [bg?.gradientEnd ?? '#eff6ff'],
            gradientAngle: [bg?.gradientAngle ?? 135],
            imageUrl: [bg?.imageUrl ?? ''],
            imageSize: [bg?.imageSize ?? 'cover'],
            imagePosition: [bg?.imagePosition ?? 'center'],
            imageRepeat: [bg?.imageRepeat ?? 'no-repeat'],
            overlayColor: [bg?.overlayColor ?? '#000000'],
            overlayOpacity: [bg?.overlayOpacity ?? 0],
            paddingTop: [s.paddingTop ?? ''],
            paddingBottom: [s.paddingBottom ?? ''],
            paddingLeft: [s.paddingLeft ?? ''],
            paddingRight: [s.paddingRight ?? ''],
            minHeight: [s.minHeight ?? ''],
            fullWidth: [s.fullWidth ?? false],
            containerMaxWidth: [s.containerMaxWidth ?? ''],
            cssClass: [s.cssClass ?? ''],
            anchorId: [s.anchorId ?? ''],
        });
    }

    private patchForm(): void {
        const s = this.section?.settings ?? {};
        const bg = s.background;
        this.form.patchValue({
            bgType: bg?.type ?? 'none',
            bgColor: bg?.color ?? '#ffffff',
            gradientStart: bg?.gradientStart ?? '#ffffff',
            gradientEnd: bg?.gradientEnd ?? '#eff6ff',
            gradientAngle: bg?.gradientAngle ?? 135,
            imageUrl: bg?.imageUrl ?? '',
            imageSize: bg?.imageSize ?? 'cover',
            imagePosition: bg?.imagePosition ?? 'center',
            imageRepeat: bg?.imageRepeat ?? 'no-repeat',
            overlayColor: bg?.overlayColor ?? '#000000',
            overlayOpacity: bg?.overlayOpacity ?? 0,
            paddingTop: s.paddingTop ?? '',
            paddingBottom: s.paddingBottom ?? '',
            paddingLeft: s.paddingLeft ?? '',
            paddingRight: s.paddingRight ?? '',
            minHeight: s.minHeight ?? '',
            fullWidth: s.fullWidth ?? false,
            containerMaxWidth: s.containerMaxWidth ?? '',
            cssClass: s.cssClass ?? '',
            anchorId: s.anchorId ?? '',
        }, { emitEvent: false });
    }

    onApply(): void {
        const v = this.form.value;
        const bgType: string = v.bgType;

        let background: SectionSettings['background'] | undefined;
        if (bgType === 'solid') {
            background = { type: 'solid', color: v.bgColor };
        } else if (bgType === 'gradient') {
            background = {
                type: 'gradient',
                gradientStart: v.gradientStart,
                gradientEnd: v.gradientEnd,
                gradientAngle: v.gradientAngle ?? 135
            };
        } else if (bgType === 'image') {
            background = {
                type: 'image',
                imageUrl: v.imageUrl || undefined,
                imageSize: v.imageSize || 'cover',
                imagePosition: v.imagePosition || 'center',
                imageRepeat: v.imageRepeat || 'no-repeat',
                overlayColor: v.overlayColor || undefined,
                overlayOpacity: v.overlayOpacity != null ? Number(v.overlayOpacity) : undefined,
            };
        }

        const num = (val: any): number | undefined =>
            val !== '' && val !== null && val !== undefined ? Number(val) : undefined;

        const newSettings: SectionSettings = {
            ...this.section.settings,
            background,
            paddingTop: num(v.paddingTop),
            paddingBottom: num(v.paddingBottom),
            paddingLeft: num(v.paddingLeft),
            paddingRight: num(v.paddingRight),
            minHeight: num(v.minHeight),
            fullWidth: v.fullWidth || undefined,
            containerMaxWidth: num(v.containerMaxWidth),
            cssClass: v.cssClass?.trim() || undefined,
            anchorId: v.anchorId?.trim() || undefined,
        };

        this.update.emit(newSettings);
    }

    onReset(): void {
        this.patchForm();
    }
}
