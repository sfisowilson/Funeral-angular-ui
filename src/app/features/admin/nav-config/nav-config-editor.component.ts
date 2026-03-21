import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavConfigDto, NavItem, NavItemType, NavMegaColumn } from '@app/core/models/nav-config.model';
import { NavConfigService } from '@app/core/services/nav-config.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

function newItem(order = 0): NavItem {
    return {
        id: uuid(),
        label: '',
        type: 'link',
        url: '',
        slug: '',
        openInNewTab: false,
        order,
        children: [],
        megaColumns: []
    };
}

function newColumn(): NavMegaColumn {
    return { id: uuid(), header: '', items: [] };
}

@Component({
    selector: 'app-nav-config-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToastModule, PanelModule, DividerModule, TooltipModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="p-4 max-w-5xl mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-1">Navigation Menu Builder</h2>
                    <p class="text-gray-500 text-sm">Configure the public header navigation with links, dropdowns, and mega menus.</p>
                </div>
                <p-button label="Save" icon="pi pi-save" (onClick)="save()" [loading]="saving"></p-button>
            </div>

            <!-- Top-level items -->
            <div *ngFor="let item of config.items; let i = index" class="mb-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                <!-- Item header row -->
                <div class="p-4 bg-gray-50 rounded-t-lg">
                    <!-- Row 1: label + type + actions -->
                    <div class="flex items-center gap-3">
                        <span class="text-gray-400 cursor-default select-none font-mono text-xs w-6 text-center shrink-0">{{ i + 1 }}</span>
                        <input pInputText [(ngModel)]="item.label" placeholder="Label" class="flex-1 min-w-0" />
                        <p-select [(ngModel)]="item.type" [options]="typeOptions" optionLabel="label" optionValue="value"
                                  placeholder="Type" styleClass="w-36 shrink-0" (ngModelChange)="onTypeChange(item)"></p-select>
                        <p-button icon="pi pi-arrow-up" [text]="true" size="small" (onClick)="moveItem(config.items, i, -1)" [disabled]="i === 0" pTooltip="Move up"></p-button>
                        <p-button icon="pi pi-arrow-down" [text]="true" size="small" (onClick)="moveItem(config.items, i, 1)" [disabled]="i === config.items.length - 1" pTooltip="Move down"></p-button>
                        <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="removeItem(config.items, i)" pTooltip="Remove"></p-button>
                    </div>
                    <!-- Row 2: link target (only for type=link) -->
                    <div *ngIf="item.type === 'link'" class="flex items-center gap-2 mt-2 pl-9">
                        <select class="text-xs border border-gray-300 rounded px-1 py-1.5 bg-white shrink-0" [ngModel]="getLinkMode(item)" (ngModelChange)="setLinkMode(item, $event)">
                            <option value="slug">Internal page</option>
                            <option value="url">External URL</option>
                        </select>
                        <input *ngIf="getLinkMode(item) === 'slug'" pInputText [(ngModel)]="item.slug" placeholder="/about-us" class="flex-1 min-w-0" />
                        <input *ngIf="getLinkMode(item) === 'url'" pInputText [(ngModel)]="item.url" placeholder="https://..." class="flex-1 min-w-0" />
                        <label class="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap shrink-0">
                            <input type="checkbox" [(ngModel)]="item.openInNewTab" /> New tab
                        </label>
                    </div>
                </div>

                <!-- Dropdown children -->
                <div *ngIf="item.type === 'dropdown'" class="p-4">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Child links</p>
                    <div *ngFor="let child of item.children; let ci = index" class="mb-2 border border-gray-100 rounded p-2 bg-white">
                        <!-- Row 1: label + actions -->
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400 text-xs w-5 text-center shrink-0">{{ ci + 1 }}</span>
                            <input pInputText [(ngModel)]="child.label" placeholder="Label" class="flex-1 min-w-0" />
                            <p-button icon="pi pi-arrow-up" [text]="true" size="small" (onClick)="moveItem(item.children!, ci, -1)" [disabled]="ci === 0"></p-button>
                            <p-button icon="pi pi-arrow-down" [text]="true" size="small" (onClick)="moveItem(item.children!, ci, 1)" [disabled]="ci === item.children!.length - 1"></p-button>
                            <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="removeItem(item.children!, ci)"></p-button>
                        </div>
                        <!-- Row 2: link target -->
                        <div class="flex items-center gap-2 mt-1 pl-7">
                            <select class="text-xs border border-gray-300 rounded px-1 py-1.5 bg-white shrink-0" [ngModel]="getLinkMode(child)" (ngModelChange)="setLinkMode(child, $event)">
                                <option value="slug">Internal page</option>
                                <option value="url">External URL</option>
                            </select>
                            <input *ngIf="getLinkMode(child) === 'slug'" pInputText [(ngModel)]="child.slug" placeholder="/slug" class="flex-1 min-w-0" />
                            <input *ngIf="getLinkMode(child) === 'url'" pInputText [(ngModel)]="child.url" placeholder="https://..." class="flex-1 min-w-0" />
                            <label class="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap shrink-0">
                                <input type="checkbox" [(ngModel)]="child.openInNewTab" /> New tab
                            </label>
                        </div>
                    </div>
                    <p-button label="Add child link" icon="pi pi-plus" [text]="true" size="small" (onClick)="addChild(item)"></p-button>
                </div>

                <!-- Mega-menu columns -->
                <div *ngIf="item.type === 'mega'" class="p-4">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mega menu columns</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div *ngFor="let col of item.megaColumns; let ci = index" class="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div class="flex items-center gap-2 mb-2">
                                <input pInputText [(ngModel)]="col.header" placeholder="Column heading (optional)" class="flex-1" />
                                <p-button icon="pi pi-arrow-left" [text]="true" size="small" (onClick)="moveItem(item.megaColumns!, ci, -1)" [disabled]="ci === 0" pTooltip="Move left"></p-button>
                                <p-button icon="pi pi-arrow-right" [text]="true" size="small" (onClick)="moveItem(item.megaColumns!, ci, 1)" [disabled]="ci === item.megaColumns!.length - 1" pTooltip="Move right"></p-button>
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="removeItem(item.megaColumns!, ci)"></p-button>
                            </div>
                            <p-divider styleClass="!my-2"></p-divider>
                            <div *ngFor="let link of col.items; let li = index" class="mb-2 border border-gray-100 rounded p-2 bg-white">
                                <!-- Row 1: label + delete -->
                                <div class="flex items-center gap-2">
                                    <input pInputText [(ngModel)]="link.label" placeholder="Label" class="flex-1 min-w-0 text-sm" />
                                    <p-button icon="pi pi-trash" [text]="true" severity="danger" size="small" (onClick)="removeItem(col.items, li)"></p-button>
                                </div>
                                <!-- Row 2: link target -->
                                <div class="flex items-center gap-2 mt-1">
                                    <select class="text-xs border border-gray-300 rounded px-1 py-1.5 bg-white shrink-0" [ngModel]="getLinkMode(link)" (ngModelChange)="setLinkMode(link, $event)">
                                        <option value="slug">Internal</option>
                                        <option value="url">External</option>
                                    </select>
                                    <input *ngIf="getLinkMode(link) === 'slug'" pInputText [(ngModel)]="link.slug" placeholder="/slug" class="flex-1 min-w-0 text-sm" />
                                    <input *ngIf="getLinkMode(link) === 'url'" pInputText [(ngModel)]="link.url" placeholder="https://..." class="flex-1 min-w-0 text-sm" />
                                </div>
                            </div>
                            <p-button label="Add link" icon="pi pi-plus" [text]="true" size="small" (onClick)="addColumnLink(col)"></p-button>
                        </div>
                    </div>
                    <p-button label="Add column" icon="pi pi-plus" [text]="true" size="small" (onClick)="addColumn(item)" styleClass="mt-3"></p-button>
                </div>
            </div>

            <!-- Add top-level item -->
            <p-button label="Add navigation item" icon="pi pi-plus" [outlined]="true" (onClick)="addTopLevel()" styleClass="w-full mt-2"></p-button>

            <!-- Empty state -->
            <div *ngIf="config.items.length === 0" class="text-center text-gray-400 py-12">
                <i class="pi pi-bars text-4xl mb-3 block"></i>
                <p>No items yet. Click "Add navigation item" to start building your menu.</p>
            </div>
        </div>
    `
})
export class NavConfigEditorComponent implements OnInit {
    config: NavConfigDto = { items: [] };
    saving = false;

    typeOptions = [
        { label: 'Link', value: 'link' },
        { label: 'Dropdown', value: 'dropdown' },
        { label: 'Mega Menu', value: 'mega' }
    ];

    constructor(
        private navConfigService: NavConfigService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.navConfigService.get().subscribe({
            next: (dto) => {
                this.config = dto ?? { items: [] };
                if (!this.config.items) {
                    this.config.items = [];
                }
            },
            error: () => {
                this.messageService.add({ severity: 'warn', summary: 'Note', detail: 'No existing nav config — starting fresh.' });
            }
        });
    }

    addTopLevel(): void {
        this.config.items.push(newItem(this.config.items.length));
    }

    addChild(item: NavItem): void {
        if (!item.children) item.children = [];
        item.children.push(newItem(item.children.length));
    }

    addColumn(item: NavItem): void {
        if (!item.megaColumns) item.megaColumns = [];
        item.megaColumns.push(newColumn());
    }

    addColumnLink(col: NavMegaColumn): void {
        col.items.push(newItem(col.items.length));
    }

    removeItem(list: any[], index: number): void {
        list.splice(index, 1);
    }

    moveItem(list: any[], index: number, direction: -1 | 1): void {
        const target = index + direction;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
    }

    getLinkMode(item: NavItem): 'slug' | 'url' {
        return item.url ? 'url' : 'slug';
    }

    setLinkMode(item: NavItem, mode: 'slug' | 'url'): void {
        if (mode === 'slug') {
            item.url = '';
        } else {
            item.slug = '';
        }
    }

    onTypeChange(item: NavItem): void {
        // Reset children/columns when switching type to avoid stale data
        if (item.type !== 'dropdown') item.children = [];
        if (item.type !== 'mega') item.megaColumns = [];
    }

    save(): void {
        this.saving = true;
        // Assign order values based on current array positions
        this.config.items.forEach((item, i) => {
            item.order = i;
            item.children?.forEach((c, ci) => (c.order = ci));
            item.megaColumns?.forEach((col) => col.items.forEach((link, li) => (link.order = li)));
        });

        this.navConfigService.put(this.config).subscribe({
            next: () => {
                this.saving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Navigation config saved successfully.' });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save navigation config.' });
            }
        });
    }
}
