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
