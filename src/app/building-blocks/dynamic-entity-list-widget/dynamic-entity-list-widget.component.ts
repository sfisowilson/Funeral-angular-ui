import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DynamicEntityServiceProxy, DynamicEntityRecordDto, DynamicEntityTypeDto } from '../../core/services/service-proxies';
import { DynamicEntityRecordWidgetComponent } from '../dynamic-entity-record-widget/dynamic-entity-record-widget.component';

@Component({
  selector: 'app-dynamic-entity-list-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicEntityRecordWidgetComponent],
  providers: [DynamicEntityServiceProxy],
  templateUrl: './dynamic-entity-list-widget.component.html',
  styleUrls: ['./dynamic-entity-list-widget.component.scss']
})
export class DynamicEntityListWidgetComponent implements OnInit, OnChanges {
  @Input() config!: WidgetConfig | any;

  settings: any = {};
  records: DynamicEntityRecordDto[] = [];
  dynamicFields: any[] = [];
  entityTypes: DynamicEntityTypeDto[] = [];
  loading = false;
  error = '';
  filterText = '';

  showDialog = false;
  selectedRecord: DynamicEntityRecordDto | null = null;

  private lastEntityTypeKey: string | null = null;
  private lastMaxRecords: number | null = null;
  private entityTypesLoaded = false;

  constructor(private dynamicEntityService: DynamicEntityServiceProxy) {}

  ngOnInit(): void {
    this.applyConfig();
    this.loadRecordsIfConfigChanged(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.applyConfig();
      this.loadRecordsIfConfigChanged(false);
    }
  }

  get hasConfiguredEntity(): boolean {
    return !!this.settings.entityTypeKey;
  }

  get filteredRecords(): DynamicEntityRecordDto[] {
    if (!this.filterText) {
      return this.records;
    }

    const term = this.filterText.toLowerCase();
    return this.records.filter((r) => {
      const baseMatch = (r.displayName || '').toLowerCase().includes(term) ||
        (r.externalKey || '').toLowerCase().includes(term);
      if (baseMatch) {
        return true;
      }

      const data: any = (r as any).data || {};
      return this.dynamicFields.some((f) => {
        if (f.filterable === false) {
          return false;
        }
        const value = data[f.name];
        return value != null && String(value).toLowerCase().includes(term);
      });
    });
  }

  applyConfig(): void {
    this.settings = {
      title: '',
      description: '',
      entityTypeKey: '',
      maxRecords: 50,
      showAddButton: true,
      allowDelete: true,
      emptyMessage: 'No records found.',
      ...((this.config && this.config.settings) || {})
    };
  }

  private loadRecordsIfConfigChanged(force: boolean): void {
    const entityTypeKey = (this.settings.entityTypeKey || '') as string;
    const maxRecords = Number(this.settings.maxRecords || 50);

    const changed =
      force ||
      this.lastEntityTypeKey !== entityTypeKey ||
      this.lastMaxRecords !== maxRecords;

    if (!changed) {
      return;
    }

    this.lastEntityTypeKey = entityTypeKey;
    this.lastMaxRecords = maxRecords;
    this.loadRecords();
  }

  private loadRecords(): void {
    if (!this.hasConfiguredEntity) {
      this.records = [];
      this.dynamicFields = [];
      this.error = '';
      return;
    }

    const entityTypeKey = this.settings.entityTypeKey as string;

    this.loading = true;
    this.error = '';
    this.records = [];
    this.dynamicFields = [];

    // Avoid repeatedly calling EntityType_GetAll if the widget's config input
    // reference changes often (common with dynamic builders). Cache types per component instance.
    if (this.entityTypesLoaded && this.entityTypes && this.entityTypes.length) {
      this.applyEntityTypeConfigAndLoad(entityTypeKey);
      return;
    }

    this.dynamicEntityService.entityType_GetAll().subscribe({
      next: (resp) => {
        this.entityTypes = resp?.result || [];
        this.entityTypesLoaded = true;
        this.applyEntityTypeConfigAndLoad(entityTypeKey);
      },
      error: () => {
        this.error = 'Failed to load entity type configuration.';
        this.loading = false;
      }
    });
  }

  private applyEntityTypeConfigAndLoad(entityTypeKey: string): void {
    const type = this.entityTypes.find((t) => t.key === entityTypeKey) || null;

    if (type && type.fieldsJson) {
      try {
        this.dynamicFields = JSON.parse(type.fieldsJson as any) || [];
      } catch {
        this.dynamicFields = [];
      }
    } else {
      this.dynamicFields = [];
    }

    this.loadRecordList(entityTypeKey);
  }

  private loadRecordList(entityTypeKey: string): void {
    const pageSize = this.settings.maxRecords || 50;

    this.dynamicEntityService.record_List(entityTypeKey, 1, pageSize, undefined).subscribe({
      next: (response) => {
        const result = response?.result;
        const rawRecords = result?.records || [];
        this.records = rawRecords.map((r) => {
          let data: any = {};
          if (r.dataJson) {
            try {
              data = JSON.parse(r.dataJson);
            } catch {
              data = {};
            }
          }
          (r as any).data = data;
          return r;
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load records.';
        this.loading = false;
      }
    });
  }

  getFieldDisplay(record: DynamicEntityRecordDto, field: any): any {
    const data: any = (record as any).data || {};
    const value = data[field.name];
    return value ?? '';
  }

  openCreateDialog(): void {
    this.selectedRecord = null;
    this.showDialog = true;
  }

  openEditDialog(record: DynamicEntityRecordDto): void {
    this.selectedRecord = record;
    this.showDialog = true;
  }

  closeDialog(saved: boolean): void {
    this.showDialog = false;
    this.selectedRecord = null;
    if (saved) {
      this.loadRecords();
    }
  }

  deleteRecord(record: DynamicEntityRecordDto): void {
    if (!this.settings.allowDelete) {
      return;
    }

    if (!confirm('Delete this record?')) {
      return;
    }

    this.dynamicEntityService.record_Delete(this.settings.entityTypeKey, record.id).subscribe({
      next: () => this.loadRecords(),
      error: () => this.error = 'Failed to delete record.'
    });
  }
}
