import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-premium-calculator-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ColorPickerModule, AccordionModule],
    template: `
        <div class="container-fluid">
            <p-accordion [multiple]="true" [activeIndex]="[0]">
                <!-- Content Settings -->
                <p-accordionTab header="Content Settings">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Title</label>
                            <input type="text" class="form-control" [(ngModel)]="config.title" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Title Font Size (px)</label>
                            <input type="number" class="form-control" [(ngModel)]="config.titleSize" min="16" max="72" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Subtitle</label>
                            <input type="text" class="form-control" [(ngModel)]="config.subtitle" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Subtitle Font Size (px)</label>
                            <input type="number" class="form-control" [(ngModel)]="config.subtitleSize" min="12" max="32" />
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Button Settings -->
                <p-accordionTab header="Button Settings">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Calculate Button Text</label>
                            <input type="text" class="form-control" [(ngModel)]="config.calculateButtonText" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Calculate Button Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.buttonColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.buttonColor" placeholder="#000000" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Calculate Button Text Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.buttonTextColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.buttonTextColor" placeholder="#ffffff" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Sign Up Button Text</label>
                            <input type="text" class="form-control" [(ngModel)]="config.signupButtonText" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Sign Up Button Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.signupButtonColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.signupButtonColor" placeholder="#000000" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Sign Up Button Text Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.signupButtonTextColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.signupButtonTextColor" placeholder="#ffffff" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Sign Up URL</label>
                            <input type="text" class="form-control" [(ngModel)]="config.signupUrl" placeholder="/auth/register (or /auth/tenant-register for host)" />
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Result Display Settings -->
                <p-accordionTab header="Result Display Settings">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Label</label>
                            <input type="text" class="form-control" [(ngModel)]="config.resultLabel" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Period Text</label>
                            <input type="text" class="form-control" [(ngModel)]="config.resultPeriod" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Currency Symbol</label>
                            <input type="text" class="form-control" [(ngModel)]="config.currency" />
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Background Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.resultBackgroundColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.resultBackgroundColor" placeholder="#f8f9fa" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Border Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.resultBorderColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.resultBorderColor" placeholder="#dee2e6" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Label Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.resultLabelColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.resultLabelColor" placeholder="#6c757d" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Amount Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.resultAmountColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.resultAmountColor" placeholder="#212529" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Result Period Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.resultPeriodColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.resultPeriodColor" placeholder="#6c757d" />
                            </div>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Color Settings -->
                <p-accordionTab header="Color Settings">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Background Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.backgroundColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.backgroundColor" placeholder="#ffffff" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Card Background Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.cardBackgroundColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.cardBackgroundColor" placeholder="#ffffff" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Title Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.titleColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.titleColor" placeholder="#212529" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Subtitle Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.subtitleColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.subtitleColor" placeholder="#6c757d" />
                            </div>
                        </div>
                        <div class="col-12">
                            <label class="form-label fw-semibold">Label Color</label>
                            <div class="d-flex align-items-center gap-2">
                                <p-colorPicker [(ngModel)]="config.labelColor" appendTo="body" [style]="{ 'z-index': '9999' }"></p-colorPicker>
                                <input type="text" class="form-control" [(ngModel)]="config.labelColor" placeholder="#212529" />
                            </div>
                        </div>
                    </div>
                </p-accordionTab>

                <!-- Layout Settings -->
                <p-accordionTab header="Layout Settings">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label fw-semibold">Padding (px)</label>
                            <input type="number" class="form-control" [(ngModel)]="config.padding" min="0" max="100" />
                        </div>
                    </div>
                </p-accordionTab>
            </p-accordion>

            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
                <button type="button" class="btn btn-success" (click)="update.emit(config)">Save</button>
            </div>
        </div>
    `
})
export class PremiumCalculatorEditorComponent {
    @Input() config: any;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();
}
