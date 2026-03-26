import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
    selector: 'app-policy-cover-premium-table-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, FieldsetModule],
    template: `
        <div class="policy-cover-premium-table-editor p-4">
            <p-fieldset legend="General Settings">
                <div class="field">
                    <label for="title">Title</label>
                    <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" />
                </div>
                <div class="field mt-4">
                    <label for="subtitle">Subtitle</label>
                    <input pInputText id="subtitle" [(ngModel)]="settings.subtitle" class="w-full" />
                </div>
            </p-fieldset>

            <p-fieldset legend="Colors" class="mt-4">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Background Color</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.backgroundColor" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Background Opacity</label>
                        <input type="range" class="form-range" min="0" max="1" step="0.01" [(ngModel)]="settings.backgroundOpacity" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Title Color</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.titleColor" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Subtitle Color</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.subtitleColor" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Table Header Background</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.headerBackgroundColor" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Table Header Text</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.headerTextColor" />
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Table Cell Text</label>
                        <input type="color" class="form-control form-control-color" [(ngModel)]="settings.cellTextColor" />
                    </div>
                </div>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class PolicyCoverPremiumTableEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
