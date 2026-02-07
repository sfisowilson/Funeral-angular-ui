import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicEntityServiceProxy, CreateDynamicEntityTypeDto, UpdateDynamicEntityTypeDto, DynamicEntityTypeDto } from '@app/core/services/service-proxies';

@Component({
    selector: 'app-dynamic-entity-type-widget',
    templateUrl: './dynamic-entity-type-widget.component.html',
    styleUrls: ['./dynamic-entity-type-widget.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [DynamicEntityServiceProxy]
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

    /**
     * Auto-generate key from name when name changes
     */
    onNameChange(): void {
        // Only auto-generate key if it's a new entity or key is empty
        if (!this.entityType || !this.key) {
            this.key = this.convertToKey(this.name);
        }
    }

    /**
     * Validate and format field name when it changes
     */
    onFieldNameBlur(field: any): void {
        if (field.name) {
            // Convert to camelCase for consistency
            field.name = this.convertToCamelCase(field.name);
            
            // Auto-generate label if empty
            if (!field.label) {
                field.label = this.formatFieldLabel(field.name);
            }
        }
    }

    /**
     * Auto-generate field name from label when label changes
     */
    onFieldLabelChange(field: any): void {
        // Only auto-generate name if it's a new field with default name pattern
        if (field.label && (!field.name || field.name.startsWith('field_'))) {
            field.name = this.convertToCamelCase(field.label);
        }
    }

    onFieldsChanged(fields: any[]) {
        this.fieldsJson = fields;
    }

    onFieldTypeChange(field: any): void {
        if (field.type === 'idNumber') {
            const baseName = field.name || '';
            const targetAgeName = baseName ? `${baseName}_age` : 'age';
            const targetGenderName = baseName ? `${baseName}_gender` : 'gender';

            const hasAge = this.fieldsJson.some((f) => f.name.toLowerCase() === targetAgeName.toLowerCase());
            const hasGender = this.fieldsJson.some((f) => f.name.toLowerCase() === targetGenderName.toLowerCase());

            let inserted = false;
            let insertIdx = this.fieldsJson.indexOf(field) + 1;

            if (!hasAge) {
                this.fieldsJson.splice(insertIdx, 0, {
                    name: targetAgeName,
                    label: 'Age',
                    type: 'number',
                    required: false,
                    placeholder: 'Auto-calculated',
                    options: '',
                    order: 0,
                    showInList: true,
                    filterable: true
                });
                insertIdx++;
                inserted = true;
            }

            if (!hasGender) {
                this.fieldsJson.splice(insertIdx, 0, {
                    name: targetGenderName,
                    label: 'Gender',
                    type: 'select',
                    required: false,
                    placeholder: 'Select gender',
                    options: 'Male, Female',
                    order: 0,
                    showInList: true,
                    filterable: true
                });
                insertIdx++;
                inserted = true;
            }

            if (inserted) {
                this.fieldsJson.forEach((f, i) => (f.order = i + 1));
            }
        }
    }

    addField() {
        const index = this.fieldsJson.length + 1;
        this.fieldsJson.push({
            name: '', // Start empty, user will fill in or it will auto-generate from label
            label: `New Field ${index}`,
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
        // Validate and format names before saving
        if (!this.name || !this.key) {
            this.error = 'Name and Key are required.';
            return;
        }

        // Ensure key is in proper format
        this.key = this.convertToKey(this.key);

        // Validate all fields have names
        const invalidFields = this.fieldsJson.filter(f => !f.name || !f.label);
        if (invalidFields.length > 0) {
            this.error = 'All fields must have a name and label.';
            return;
        }

        // Format all field names to camelCase
        this.fieldsJson.forEach(field => {
            field.name = this.convertToCamelCase(field.name);
        });

        this.loading = true;
        this.error = '';
        const dto = this.entityType
            ? ({
                  id: this.entityType.id,
                  name: this.name,
                  key: this.key,
                  description: this.description,
                  isActive: this.isActive,
                  fieldsJson: JSON.stringify(this.fieldsJson)
              } as UpdateDynamicEntityTypeDto)
            : ({
                  name: this.name,
                  key: this.key,
                  description: this.description,
                  isActive: this.isActive,
                  fieldsJson: JSON.stringify(this.fieldsJson)
              } as CreateDynamicEntityTypeDto);
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

    /**
     * Format a string to be user-friendly with proper spacing and title case
     * Examples: "Extended_Family_Members" -> "Extended Family Members"
     *           "beneficiaries" -> "Beneficiaries"
     */
    formatToUserFriendly(value: string): string {
        if (!value) return '';
        return value
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Convert user-friendly name to a proper key format
     * Examples: "Extended Family Members" -> "Extended_Family_Members"
     *           "My Custom Type" -> "My_Custom_Type"
     */
    convertToKey(value: string): string {
        if (!value) return '';
        // Remove special characters except spaces and underscores
        return value
            .trim()
            .replace(/[^a-zA-Z0-9\s_]/g, '')
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('_');
    }

    /**
     * Convert field name to camelCase format
     * Examples: "Full Name" -> "fullName", "Date of Birth" -> "dateOfBirth"
     */
    convertToCamelCase(value: string): string {
        if (!value) return '';
        const words = value
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .split(/\s+/);
        
        if (words.length === 0) return '';
        
        return words[0].toLowerCase() + words.slice(1)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    /**
     * Format field label from camelCase/PascalCase
     * Examples: "fullName" -> "Full Name", "dateOfBirth" -> "Date Of Birth"
     */
    formatFieldLabel(fieldName: string): string {
        if (!fieldName) return '';
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}
