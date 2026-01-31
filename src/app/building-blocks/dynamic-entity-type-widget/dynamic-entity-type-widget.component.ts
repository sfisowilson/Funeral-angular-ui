import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicEntityServiceProxy, CreateDynamicEntityTypeDto, UpdateDynamicEntityTypeDto, DynamicEntityTypeDto } from '@app/core/services/service-proxies';

@Component({
  selector: 'app-dynamic-entity-type-widget',
  templateUrl: './dynamic-entity-type-widget.component.html',
  styleUrls: ['./dynamic-entity-type-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DynamicEntityTypeWidgetComponent {
  @Input() entityType: DynamicEntityTypeDto | null = null;
  @Output() close = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  name = '';
  key = '';
  description = '';
  isActive = true;
  fieldsJson: any[] = [];
  loading = false;
  error = '';

  ngOnInit() {
    if (this.entityType) {
      this.name = this.entityType.name;
      this.key = this.entityType.key;
      this.description = this.entityType.description;
      this.isActive = this.entityType.isActive;
      this.fieldsJson = this.entityType.fieldsJson ? JSON.parse(this.entityType.fieldsJson) : [];
    }
  }

  onFieldsChanged(fields: any[]) {
    this.fieldsJson = fields;
  }

  addField() {
    const index = this.fieldsJson.length + 1;
    this.fieldsJson.push({
      name: `field_${index}`,
      label: `Field ${index}`,
      type: 'text',
      required: false,
      placeholder: '',
      options: '',
      order: index,
      showInList: true,
      filterable: true
    });
  }

  removeField(idx: number) {
    this.fieldsJson.splice(idx, 1);
  }

  save() {
    this.loading = true;
    this.error = '';
    const dto = this.entityType ? {
      id: this.entityType.id,
      name: this.name,
      key: this.key,
      description: this.description,
      isActive: this.isActive,
      fieldsJson: JSON.stringify(this.fieldsJson)
    } as UpdateDynamicEntityTypeDto : {
      name: this.name,
      key: this.key,
      description: this.description,
      isActive: this.isActive,
      fieldsJson: JSON.stringify(this.fieldsJson)
    } as CreateDynamicEntityTypeDto;
    let call;
    if (this.entityType) {
      const updateDto = dto as UpdateDynamicEntityTypeDto;
      call = this.entityTypeService.entityType_Update(updateDto);
    } else {
      const createDto = dto as CreateDynamicEntityTypeDto;
      call = this.entityTypeService.entityType_Create(createDto);
    }
    call.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
        this.close.emit(true);
      },
      error: () => {
        this.error = 'Failed to save entity type.';
        this.loading = false;
      }
    });
  }

  cancel() {
    this.close.emit(false);
  }

  constructor(private entityTypeService: DynamicEntityServiceProxy) {}
}
