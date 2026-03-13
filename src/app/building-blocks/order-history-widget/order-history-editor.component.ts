import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-order-history-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor-panel">
            <h3 class="editor-section-title">Order History Widget</h3>

            <div class="editor-group">
                <label>Title</label>
                <input type="text" class="editor-input" [(ngModel)]="config.title" placeholder="My Orders" />
            </div>
            <div class="editor-group editor-toggle">
                <label>Show Title</label>
                <input type="checkbox" [(ngModel)]="config.showTitle" />
            </div>
            <div class="editor-group">
                <label>Max orders displayed</label>
                <input type="number" class="editor-input" [(ngModel)]="config.pageSize" min="1" max="50" />
            </div>
            <div class="editor-group editor-toggle">
                <label>Show Tracking Info</label>
                <input type="checkbox" [(ngModel)]="config.showTracking" />
            </div>
            <div class="editor-group editor-toggle">
                <label>Show Payment Status Badges</label>
                <input type="checkbox" [(ngModel)]="config.showStatusBadges" />
            </div>
            <div class="editor-group">
                <label>Currency Symbol</label>
                <input type="text" class="editor-input" [(ngModel)]="config.currencySymbol" placeholder="$" maxlength="4" />
            </div>

            <h4 class="editor-section-subtitle">Colours</h4>
            <div class="editor-group editor-color">
                <label>Background</label>
                <input type="color" [(ngModel)]="config.backgroundColor" />
            </div>
            <div class="editor-group editor-color">
                <label>Title Colour</label>
                <input type="color" [(ngModel)]="config.titleColor" />
            </div>
            <div class="editor-group editor-color">
                <label>Card Background</label>
                <input type="color" [(ngModel)]="config.cardBackground" />
            </div>
        </div>
    `,
    styles: [`
        .editor-panel { display: flex; flex-direction: column; gap: 0.75rem; }
        .editor-section-title { font-size: 0.9rem; font-weight: 700; color: #555; margin: 0 0 0.25rem; }
        .editor-section-subtitle { font-size: 0.8rem; font-weight: 600; color: #888; margin: 0.5rem 0 0; }
        .editor-group { display: flex; flex-direction: column; gap: 4px; }
        .editor-group.editor-toggle { flex-direction: row; align-items: center; gap: 8px; }
        .editor-group.editor-color { flex-direction: row; align-items: center; gap: 8px; }
        label { font-size: 0.78rem; color: #666; }
        .editor-input { border: 1px solid #ddd; border-radius: 4px; padding: 5px 8px; font-size: 0.85rem; width: 100%; box-sizing: border-box; }
    `]
})
export class OrderHistoryEditorComponent {
    @Input() config: any = {};
}
