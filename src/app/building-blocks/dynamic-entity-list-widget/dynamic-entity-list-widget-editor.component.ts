import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DynamicEntityServiceProxy, DynamicEntityTypeDto } from '../../core/services/service-proxies';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface EntityTypeOption {
    label: string;
    value: string;
    description?: string | null;
}

@Component({
    selector: 'app-dynamic-entity-list-widget-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, InputTextModule, TextareaModule, InputNumberModule, ToastModule],
    providers: [DynamicEntityServiceProxy, MessageService],
    templateUrl: './dynamic-entity-list-widget-editor.component.html',
    styleUrls: ['./dynamic-entity-list-widget-editor.component.scss']
})
export class DynamicEntityListWidgetEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    settings: any = {};
    entityTypes: EntityTypeOption[] = [];
    loadingTypes = false;

    constructor(
        private dynamicEntityService: DynamicEntityServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.settings = JSON.parse(JSON.stringify(this.config.settings || {}));

        if (this.settings.showAddButton === undefined) {
            this.settings.showAddButton = true;
        }
        if (this.settings.allowDelete === undefined) {
            this.settings.allowDelete = true;
        }
        if (this.settings.maxRecords === undefined) {
            this.settings.maxRecords = 50;
        }

        this.loadEntityTypes();
    }

    private loadEntityTypes(): void {
        this.loadingTypes = true;
        this.dynamicEntityService.entityType_GetAll().subscribe({
            next: (response) => {
                const result = response.result || [];
                const types = (result || []) as DynamicEntityTypeDto[];
                this.entityTypes = types.map((t) => ({
                    label: t.name || t.key || 'Untitled',
                    value: t.key!,
                    description: t.description
                }));
                this.loadingTypes = false;
            },
            error: () => {
                this.loadingTypes = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load dynamic entity types.'
                });
            }
        });
    }

    save(): void {
        this.config.settings = {
            ...this.config.settings,
            ...this.settings
        };

        this.update.emit(this.config.settings);
        this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Dynamic entity list settings updated.'
        });
    }
}
