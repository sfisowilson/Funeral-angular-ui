import {
    Component,
    ComponentRef,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewContainerRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { BlockNode } from '../core/document.model';
import { PageDocumentStore } from '../core/page-document.store';
import { UpdateBlockSettingsCommand } from '../core/commands/commands';
import { WIDGET_TYPES } from '../../building-blocks/widget-registry';

/**
 * Dynamically creates the editor component for the currently selected block.
 * Uses ViewContainerRef.createComponent() so that @Output() events can be wired.
 * Only re-creates when the block *id* changes; settings changes from the store
 * do not reset the active editor form.
 */
@Component({
    selector: 'app-block-editor-host',
    standalone: true,
    imports: [],
    template: ``,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                overflow-y: auto;
            }
        `
    ]
})
export class BlockEditorHostComponent implements OnChanges, OnDestroy {
    @Input() block!: BlockNode;

    private readonly vcr = inject(ViewContainerRef);
    private readonly store = inject(PageDocumentStore);

    private cmpRef: ComponentRef<any> | null = null;
    private subs: Subscription[] = [];
    private currentBlockId: string | null = null;
    private readonly styleKeywords = [
        'color',
        'background',
        'padding',
        'margin',
        'border',
        'radius',
        'shadow',
        'opacity',
        'font',
        'align',
        'style',
        'appearance'
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['block'] && this.block.id !== this.currentBlockId) {
            this.loadEditor();
        }
    }

    ngOnDestroy(): void {
        this.destroyEditor();
    }

    private loadEditor(): void {
        this.destroyEditor();
        this.currentBlockId = this.block.id;

        const wt = WIDGET_TYPES.find(w => w.name === this.block.type);
        if (!wt?.editorComponent) return;

        this.cmpRef = this.vcr.createComponent(wt.editorComponent);
        this.cmpRef.setInput('config', { settings: { ...this.block.settings } });

        const inst = this.cmpRef.instance;

        if (inst.update) {
            this.subs.push(
                inst.update.subscribe((newSettings: Record<string, unknown>) => {
                    const previousSettings = { ...this.block.settings } as Record<string, unknown>;
                    this.store.dispatch(
                        new UpdateBlockSettingsCommand(this.block.id, newSettings, previousSettings)
                    );
                })
            );
        }

        if (inst.cancel) {
            this.subs.push(inst.cancel.subscribe(() => this.store.selectElement(null)));
        }

        this.cmpRef.changeDetectorRef.detectChanges();
        this.filterStyleControls();
    }

    private destroyEditor(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.subs = [];
        this.cmpRef?.destroy();
        this.cmpRef = null;
        this.vcr.clear();
    }

    private filterStyleControls(): void {
        const root = this.cmpRef?.location.nativeElement as HTMLElement | undefined;
        if (!root) return;

        this.hideMatchingLabels(root);
        this.hideMatchingSectionTitles(root);
    }

    private hideMatchingLabels(root: HTMLElement): void {
        const labels = root.querySelectorAll('label');
        labels.forEach((label) => {
            const text = label.textContent?.trim().toLowerCase() ?? '';
            if (!this.matchesStyleKeyword(text)) return;

            const container = this.findControlContainer(label as HTMLElement);
            if (container) {
                container.style.display = 'none';
            }
        });
    }

    private hideMatchingSectionTitles(root: HTMLElement): void {
        const titleSelectors = [
            'legend',
            'summary',
            'h2',
            'h3',
            'h4',
            '.p-fieldset-legend-text',
            '.p-accordion-header-text'
        ].join(', ');

        const titles = root.querySelectorAll(titleSelectors);
        titles.forEach((title) => {
            const text = title.textContent?.trim().toLowerCase() ?? '';
            if (!this.matchesStyleKeyword(text)) return;

            const container = (title as HTMLElement).closest('fieldset, details, .p-fieldset, .p-accordion-tab, .form-section, .settings-section, .card') as HTMLElement | null;
            if (container) {
                container.style.display = 'none';
            }
        });
    }

    private matchesStyleKeyword(text: string): boolean {
        return this.styleKeywords.some((keyword) => text.includes(keyword));
    }

    private findControlContainer(label: HTMLElement): HTMLElement | null {
        return (
            label.closest('.flex.flex-col, .form-row, .field, .padding-cell, .box-cell, .col-md-6, .col-12, .form-field') as HTMLElement | null
        ) ?? label.parentElement;
    }
}
