import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
    selector: 'app-statistics-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule, ColorPickerModule, InputNumberModule, ButtonModule, FieldsetModule],
    template: `
        <div class="statistics-editor p-4">
            <p-fieldset legend="General Settings">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="title">Title</label>
                        <input pInputText id="title" [(ngModel)]="settings.title" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="titleSize">Title Size</label>
                        <p-inputNumber [(ngModel)]="settings.titleSize" [min]="12" [max]="72" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="titleColor">Title Color</label>
                        <p-colorPicker [(ngModel)]="settings.titleColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="backgroundColor">Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.backgroundColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="padding">Padding</label>
                        <p-inputNumber [(ngModel)]="settings.padding" [min]="0" [max]="100" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="cardBackgroundColor">Card Background Color</label>
                        <p-colorPicker [(ngModel)]="settings.cardBackgroundColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Icon & Text Settings" class="mt-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="field">
                        <label for="iconSize">Icon Size</label>
                        <p-inputNumber [(ngModel)]="settings.iconSize" [min]="16" [max]="128" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="iconColor">Icon Color</label>
                        <p-colorPicker [(ngModel)]="settings.iconColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="numberColor">Number Color</label>
                        <p-colorPicker [(ngModel)]="settings.numberColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="labelColor">Label Color</label>
                        <p-colorPicker [(ngModel)]="settings.labelColor" class="w-full"></p-colorPicker>
                    </div>
                    <div class="field">
                        <label for="labelSize">Label Size</label>
                        <p-inputNumber [(ngModel)]="settings.labelSize" [min]="10" [max]="24" class="w-full"></p-inputNumber>
                    </div>
                    <div class="field">
                        <label for="descriptionColor">Description Color</label>
                        <p-colorPicker [(ngModel)]="settings.descriptionColor" class="w-full"></p-colorPicker>
                    </div>
                </div>
            </p-fieldset>

            <p-fieldset legend="Statistics" class="mt-4">
                <div *ngFor="let stat of settings.statistics; let i = index" class="statistic-item border p-4 mb-4 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="field">
                            <label>Icon (PrimeIcons class)</label>
                            <input pInputText [(ngModel)]="stat.icon" placeholder="pi pi-chart-bar" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Value</label>
                            <input pInputText [(ngModel)]="stat.value" placeholder="1,234" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Label</label>
                            <input pInputText [(ngModel)]="stat.label" placeholder="Active Members" class="w-full" />
                        </div>
                        <div class="field">
                            <label>Description (Optional)</label>
                            <input pInputText [(ngModel)]="stat.description" placeholder="Growing monthly" class="w-full" />
                        </div>
                    </div>
                    <button pButton type="button" label="Remove" class="p-button-danger p-button-sm mt-2" (click)="removeStat(i)"></button>
                </div>
                <button pButton type="button" label="Add Statistic" class="p-button-success" (click)="addStat()"></button>
            </p-fieldset>

            <div class="mt-4">
                <button pButton type="button" label="Update Widget" (click)="updateWidget()"></button>
            </div>
        </div>
    `
})
export class StatisticsEditorComponent implements OnChanges {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    settings: any = {};

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            this.settings = { ...this.config.settings };
        }
    }

    addStat(): void {
        if (!this.settings.statistics) {
            this.settings.statistics = [];
        }
        this.settings.statistics.push({
            icon: 'pi pi-chart-bar',
            value: '0',
            label: 'New Statistic',
            description: ''
        });
    }

    removeStat(index: number): void {
        this.settings.statistics.splice(index, 1);
    }

    updateWidget(): void {
        this.update.emit(this.settings);
    }
}
