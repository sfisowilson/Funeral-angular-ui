import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageDocumentStore } from '../core/page-document.store';
import { BlockEditorHostComponent } from './block-editor-host.component';
import { SectionEditorComponent } from './section-editor.component';
import { BlockStyleEditorComponent } from './block-style-editor.component';
import { BlockAdvancedEditorComponent } from './block-advanced-editor.component';
import { UpdateSectionSettingsCommand } from '../core/commands/commands';
import { SectionSettings } from '../core/document.model';

type RightPanelTab = 'content' | 'style' | 'advanced';
type SectionPanelTab = 'layout' | 'style' | 'advanced';

@Component({
    selector: 'app-builder-right-panel',
    standalone: true,
    imports: [CommonModule, BlockEditorHostComponent, SectionEditorComponent, BlockStyleEditorComponent, BlockAdvancedEditorComponent],
    template: `
        <div class="right-panel">
            @if (!store.selectedId()) {
                <!-- Nothing selected -->
                <div class="empty-state">
                    <i class="pi pi-cursor" style="font-size: 2rem; color: #d1d5db;"></i>
                    <p class="empty-title">Nothing selected</p>
                    <p class="empty-hint">Click an element on the canvas to see its properties.</p>
                </div>
            } @else if (selectedSection()) {
                <!-- Section selected -->
                <div class="panel-header">
                    <div class="panel-header__icon">
                        <i class="pi pi-table"></i>
                    </div>
                    <div class="panel-header__info">
                        <span class="panel-header__type">Section</span>
                        <span class="panel-header__id">{{ store.selectedId() }}</span>
                    </div>
                    <button class="deselect-btn" (click)="store.selectElement(null)" title="Deselect">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <!-- Section Content / Style / Advanced tabs -->
                <div class="panel-tabs panel-tabs--section">
                    <button class="tab-btn" [class.active]="store.sectionEditorTab() === 'layout'" (click)="setSectionTab('layout')">Layout</button>
                    <button class="tab-btn" [class.active]="store.sectionEditorTab() === 'style'" (click)="setSectionTab('style')">Style</button>
                    <button class="tab-btn" [class.active]="store.sectionEditorTab() === 'advanced'" (click)="setSectionTab('advanced')">Advanced</button>
                </div>

                <div class="editor-host-wrapper">
                    <app-section-editor
                        [section]="selectedSection()!"
                        [activeTab]="store.sectionEditorTab()"
                        (update)="onSectionUpdate($event)"
                    />
                </div>
            } @else if (store.selectedBlock()) {
                <!-- Block selected -->
                <div class="panel-header">
                    <div class="panel-header__icon">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="panel-header__info">
                        <span class="panel-header__type">{{ store.selectedBlock()!.type }}</span>
                        <span class="panel-header__id">{{ store.selectedId() }}</span>
                    </div>
                    <button class="deselect-btn" (click)="store.selectElement(null)" title="Deselect">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <!-- Content / Style / Advanced tabs -->
                <div class="panel-tabs">
                    <button class="tab-btn" [class.active]="activeTab() === 'content'" (click)="setTab('content')">Content</button>
                    <button class="tab-btn" [class.active]="activeTab() === 'style'" (click)="setTab('style')">Style</button>
                    <button class="tab-btn" [class.active]="activeTab() === 'advanced'" (click)="setTab('advanced')">Advanced</button>
                </div>

                <div class="editor-host-wrapper">
                    @if (activeTab() === 'content') {
                        <app-block-editor-host [block]="store.selectedBlock()!" />
                    } @else if (activeTab() === 'style') {
                        <app-block-style-editor [block]="store.selectedBlock()!" />
                    } @else {
                        <app-block-advanced-editor [block]="store.selectedBlock()!" />
                    }
                </div>
            } @else {
                <!-- ID doesn't resolve to anything meaningful -->
                <div class="empty-state">
                    <p class="empty-hint">Click an element to edit it.</p>
                </div>
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
            }

            .right-panel {
                height: 100%;
                background: white;
                border-left: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
            }

            /* Empty state */
            .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 24px;
                text-align: center;
            }

            .empty-title {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin: 0;
            }

            .empty-hint {
                font-size: 13px;
                color: #9ca3af;
                margin: 0;
            }

            /* Panel header */
            .panel-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                border-bottom: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .panel-header__icon {
                width: 32px;
                height: 32px;
                background: #eff6ff;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #2563eb;
                flex-shrink: 0;
            }

            .panel-header__info {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .panel-header__type {
                font-size: 13px;
                font-weight: 600;
                color: #111827;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .panel-header__id {
                font-size: 10px;
                font-family: monospace;
                color: #9ca3af;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .deselect-btn {
                width: 28px;
                height: 28px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ca3af;
                flex-shrink: 0;
            }

            .deselect-btn:hover {
                background: #f3f4f6;
                color: #374151;
            }

            /* Tabs */
            .panel-tabs {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 8px;
                padding: 8px;
                background: #f8fafc;
                border-bottom: 1px solid #e5e7eb;
                flex-shrink: 0;
            }

            .panel-tabs--section {
                background: #eff6ff;
                border-bottom-color: #bfdbfe;
            }

            .tab-btn {
                min-height: 36px;
                padding: 8px 10px;
                border: 1px solid #dbe4f0;
                background: white;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                color: #475569;
                border-radius: 8px;
                transition: color 0.1s, border-color 0.1s, background 0.1s, box-shadow 0.1s;
            }

            .tab-btn:hover {
                color: #0f172a;
                border-color: #94a3b8;
            }

            .tab-btn.active {
                color: #2563eb;
                background: #dbeafe;
                border-color: #93c5fd;
                box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.08);
            }

            .panel-tabs--section .tab-btn.active {
                color: white;
                background: #2563eb;
                border-color: #2563eb;
                box-shadow: none;
            }

            /* Panel body */
            .panel-body {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            /* Editor host */
            .editor-host-wrapper {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
            }

            .coming-soon {
                font-size: 13px;
                color: #9ca3af;
                text-align: center;
                margin-top: 20px;
            }
        `
    ]
})
export class RightPanelComponent {
    readonly store = inject(PageDocumentStore);
    readonly activeTab = signal<RightPanelTab>('content');

    readonly selectedSection = computed(() => this.store.selectedSection());

    constructor() {
        // Reset tabs when selection changes
        let prevBlockId: string | null | undefined = undefined;
        let prevSectionId: string | null | undefined = undefined;
        effect(() => {
            // Block tabs
            const bId = this.store.selectedBlock()?.id;
            if (bId !== prevBlockId) {
                prevBlockId = bId;
                if (bId) this.activeTab.set('content');
            }

            // Section tabs
            const sId = this.store.selectedSection()?.id;
            if (sId !== prevSectionId) {
                prevSectionId = sId;
                if (sId) this.store.sectionEditorTab.set('layout');
            }
        });
    }

    setTab(tab: RightPanelTab): void {
        this.activeTab.set(tab);
    }

    setSectionTab(tab: SectionPanelTab): void {
        this.store.sectionEditorTab.set(tab);
    }

    onSectionUpdate(newSettings: SectionSettings): void {
        const section = this.store.selectedSection();
        if (!section) return;
        this.store.dispatch(
            new UpdateSectionSettingsCommand(section.id, newSettings, section.settings)
        );
    }
}
