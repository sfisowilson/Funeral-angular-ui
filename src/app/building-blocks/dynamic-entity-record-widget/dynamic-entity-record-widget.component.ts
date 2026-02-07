import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicEntityServiceProxy, CreateDynamicEntityRecordDto, UpdateDynamicEntityRecordDto, DynamicEntityRecordDto, DynamicEntityTypeDto } from '@app/core/services/service-proxies';
import { DynamicFileUploadComponent } from '../../shared/components/dynamic-file-upload/dynamic-file-upload.component';

@Component({
    selector: 'app-dynamic-entity-record-widget',
    templateUrl: './dynamic-entity-record-widget.component.html',
    styleUrls: ['./dynamic-entity-record-widget.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFileUploadComponent],
    providers: [DynamicEntityServiceProxy]
})
export class DynamicEntityRecordWidgetComponent implements OnInit {
    @Input() entityTypeKey: string = '';
    @Input() record: DynamicEntityRecordDto | null = null;
    @Output() close = new EventEmitter<boolean>();
    @Output() saved = new EventEmitter<void>();

    entityType: DynamicEntityTypeDto | null = null;
    formData: any = {};
    dynamicFields: any[] = [];
    loading = false;
    error = '';
    displayName = '';
    externalKey = '';
    lookupOptions: { [fieldName: string]: { id: string; label: string }[] } = {};

    constructor(private dynamicEntityService: DynamicEntityServiceProxy) {}

    ngOnInit() {
        if (this.entityTypeKey) {
            this.dynamicEntityService.entityType_GetAll().subscribe({
                next: (response) => {
                    const types = response?.result || [];
                    this.entityType = types.find((t) => t.key === this.entityTypeKey) || null;
                    if (this.record) {
                        this.displayName = this.record.displayName;
                        this.externalKey = this.record.externalKey;
                        this.formData = this.record.dataJson ? JSON.parse(this.record.dataJson) : {};
                    }

                    if (this.entityType && this.entityType.fieldsJson) {
                        try {
                            this.dynamicFields = JSON.parse(this.entityType.fieldsJson);
                        } catch {
                            this.dynamicFields = [];
                        }
                        this.loadLookupOptions();
                    } else {
                        this.dynamicFields = [];
                    }
                },
                error: () => (this.error = 'Failed to load entity type.')
            });
        }
    }

    onFormChange(data: any) {
        this.formData = data;
    }

    getOptions(field: any): string[] {
        if (!field || field.options == null) {
            return [];
        }
        if (Array.isArray(field.options)) {
            return field.options;
        }
        if (typeof field.options === 'string') {
            return field.options
                .split(',')
                .map((o: string) => o.trim())
                .filter((o: string) => !!o);
        }
        return [];
    }

    onFileUploaded(field: any, event: any): void {
        // dynamic entities utilize formData object, not formGroup
        // Event is expected to be an array of files or single object depending on component output
        const fileId = Array.isArray(event) ? event[0]?.id : event?.id;
        if (fileId) {
             this.formData[field.name] = fileId;
        }
    }

    private loadLookupOptions() {
        this.lookupOptions = {};
        if (!this.dynamicFields || !this.dynamicFields.length) {
            return;
        }

        const processedKeys = new Set<string>();

        for (const field of this.dynamicFields) {
            if (!field || field.type !== 'lookup' || !field.lookupEntityTypeKey) {
                continue;
            }

            const targetKey: string = field.lookupEntityTypeKey;
            if (!targetKey || processedKeys.has(targetKey)) {
                continue;
            }

            processedKeys.add(targetKey);

            this.dynamicEntityService.record_List(targetKey, 1, 1000, undefined).subscribe({
                next: (resp) => {
                    const records = resp?.result?.records || [];
                    const opts = records.map((r: any) => ({
                        id: r.id,
                        label: r.displayName || r.externalKey || r.id
                    }));

                    // Assign the same options array to all fields that use this target key
                    for (const f of this.dynamicFields) {
                        if (f && f.type === 'lookup' && f.lookupEntityTypeKey === targetKey) {
                            this.lookupOptions[f.name] = opts;
                        }
                    }
                },
                error: () => {
                    // On error, leave options empty for this lookup
                }
            });
        }
    }

    getLookupOptions(field: any): { id: string; label: string }[] {
        if (!field || !field.name) {
            return [];
        }
        return this.lookupOptions[field.name] || [];
    }

    save() {
        if (!this.entityType) return;
        this.loading = true;
        this.error = '';
        const dto = this.record
            ? ({
                  id: this.record.id,
                  entityTypeId: this.entityType.id,
                  displayName: this.displayName,
                  externalKey: this.externalKey,
                  dataJson: JSON.stringify(this.formData)
              } as UpdateDynamicEntityRecordDto)
            : ({
                  entityTypeId: this.entityType.id,
                  displayName: this.displayName,
                  externalKey: this.externalKey,
                  dataJson: JSON.stringify(this.formData)
              } as CreateDynamicEntityRecordDto);
        let call;
        if (this.record) {
            const updateDto = dto as UpdateDynamicEntityRecordDto;
            call = this.dynamicEntityService.record_Update(this.entityTypeKey, updateDto);
        } else {
            const createDto = dto as CreateDynamicEntityRecordDto;
            call = this.dynamicEntityService.record_Create(this.entityTypeKey, createDto);
        }
        call.subscribe({
            next: () => {
                this.loading = false;
                this.saved.emit();
                this.close.emit(true);
            },
            error: () => {
                this.error = 'Failed to save record.';
                this.loading = false;
            }
        });
    }

    cancel() {
        this.close.emit(false);
    }
}
