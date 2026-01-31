
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@app/auth/auth-service';
import { ActivatedRoute } from '@angular/router';
import { DynamicEntityServiceProxy, DynamicEntityTypeDto, DynamicEntityRecordDto } from '@app/core/services/service-proxies';
import { DynamicEntityRecordWidgetComponent } from '@app/building-blocks/dynamic-entity-record-widget/dynamic-entity-record-widget.component';

@Component({
  selector: 'app-dynamic-entity-record-management',
  templateUrl: './dynamic-entity-record-management.component.html',
  styleUrls: ['./dynamic-entity-record-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicEntityRecordWidgetComponent],
  providers: [DynamicEntityServiceProxy]
})
export class DynamicEntityRecordManagementComponent implements OnInit {
  entityTypes: DynamicEntityTypeDto[] = [];
  selectedTypeKey: string = '';
  records: DynamicEntityRecordDto[] = [];
  filterText: string = '';
  dynamicFields: any[] = [];
  loading = false;
  error = '';
  showDialog = false;
  selectedRecord: DynamicEntityRecordDto | null = null;

  constructor(
    private entityTypeService: DynamicEntityServiceProxy,
    private recordService: DynamicEntityServiceProxy,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  get canCreateOrUpdate(): boolean {
    return this.authService.hasAnyPermission([
      'Permission.dynamicEntityRecord.create',
      'Permission.dynamicEntityRecord.update'
    ]);
  }

  get canDelete(): boolean {
    return this.authService.hasPermission('Permission.dynamicEntityRecord.delete');
  }

  ngOnInit() {
    // React to route parameter for direct navigation to an entity's admin page
    this.route.paramMap.subscribe((params) => {
      const typeKey = params.get('typeKey');
      if (typeKey) {
        this.selectedTypeKey = typeKey;
        this.refreshRecords();
      }
    });

    this.entityTypeService.entityType_GetAll().subscribe({
      next: (response) => this.entityTypes = response?.result || [],
      error: () => this.error = 'Failed to load entity types.'
    });
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

  refreshRecords() {
    if (!this.selectedTypeKey) return;
    this.loading = true;
    this.error = '';

    // Load dynamic field metadata for the selected entity type
    const type = this.entityTypes.find((t) => t.key === this.selectedTypeKey);
    if (type && type.fieldsJson) {
      try {
        this.dynamicFields = JSON.parse(type.fieldsJson);
      } catch {
        this.dynamicFields = [];
      }
    } else {
      this.dynamicFields = [];
    }

    this.recordService.record_List(this.selectedTypeKey, 1, 50, undefined).subscribe({
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

  openCreateDialog() {
    this.selectedRecord = null;
    this.showDialog = true;
  }

  openEditDialog(record: DynamicEntityRecordDto) {
    this.selectedRecord = record;
    this.showDialog = true;
  }

  closeDialog(saved: boolean) {
    this.showDialog = false;
    this.selectedRecord = null;
    if (saved) {
      this.refreshRecords();
    }
  }

  deleteRecord(record: DynamicEntityRecordDto) {
    if (confirm('Delete this record?')) {
      this.recordService.record_Delete(this.selectedTypeKey, record.id).subscribe({
        next: () => this.refreshRecords(),
        error: () => this.error = 'Failed to delete record.'
      });
    }
  }

  getFieldDisplay(record: DynamicEntityRecordDto, field: any): any {
    const data: any = (record as any).data || {};
    const value = data[field.name];
    return value ?? '';
  }
}
