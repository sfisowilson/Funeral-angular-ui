import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
  OnboardingFieldDefinitionServiceProxy, 
  CreateOnboardingFieldDefinitionDto,
  UpdateOnboardingFieldDefinitionDto
} from '@app/core/services/service-proxies';

interface FieldTypeOption {
  label: string;
  value: string;
  icon: string;
}

interface FieldOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-field-definition-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    InputTextarea,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './field-definition-builder.component.html',
  styleUrls: ['./field-definition-builder.component.scss']
})
export class FieldDefinitionBuilderComponent implements OnInit {
  fields = signal<any[]>([]);
  loading = signal(false);
  
  showDialog = signal(false);
  dialogMode: 'create' | 'edit' = 'create';
  fieldForm!: FormGroup;
  
  fieldOptions: FieldOption[] = [];
  showOptionsEditor = signal(false);
  
  fieldTypes: FieldTypeOption[] = [
    { label: 'Text Input', value: 'text', icon: 'pi pi-pencil' },
    { label: 'Email', value: 'email', icon: 'pi pi-envelope' },
    { label: 'Phone', value: 'tel', icon: 'pi pi-phone' },
    { label: 'Number', value: 'number', icon: 'pi pi-hashtag' },
    { label: 'Date', value: 'date', icon: 'pi pi-calendar' },
    { label: 'Dropdown', value: 'select', icon: 'pi pi-list' },
    { label: 'Radio Buttons', value: 'radio', icon: 'pi pi-circle' },
    { label: 'Checkbox', value: 'checkbox', icon: 'pi pi-check-square' },
    { label: 'Text Area', value: 'textarea', icon: 'pi pi-align-left' },
    { label: 'File Upload', value: 'file', icon: 'pi pi-upload' },
    { label: 'Premium Calculator', value: 'calculator', icon: 'pi pi-calculator' },
    { label: 'Repeater (Multiple Items)', value: 'repeater', icon: 'pi pi-th-large' }
  ];

  constructor(
    private fieldClient: OnboardingFieldDefinitionServiceProxy,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadFields();
  }

  initForm(): void {
    this.fieldForm = this.fb.group({
      id: [null],
      fieldKey: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
      fieldLabel: ['', [Validators.required, Validators.maxLength(200)]],
      fieldType: ['text', Validators.required],
      placeholder: ['', Validators.maxLength(500)],
      helpText: ['', Validators.maxLength(1000)],
      defaultValue: ['', Validators.maxLength(200)],
      isRequired: [false],
      isEnabled: [true],
      minLength: [null],
      maxLength: [null],
      minValue: [null],
      maxValue: [null],
      pattern: [''],
      cssClass: ['', Validators.maxLength(100)],
      displayOrder: [0]
    });

    // Watch field type changes to show/hide options editor
    this.fieldForm.get('fieldType')?.valueChanges.subscribe(type => {
      this.showOptionsEditor.set(['select', 'radio'].includes(type));
      if (this.showOptionsEditor()) {
        this.loadOptionsFromForm();
      }
    });
  }

  loadFields(): void {
    this.loading.set(true);
    this.fieldClient.onboardingFieldDefinition_GetAll().subscribe({
      next: (fields: any) => {
        this.fields.set(fields);
        this.loading.set(false);
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load field definitions'
        });
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.dialogMode = 'create';
    this.fieldForm.reset({
      fieldType: 'text',
      isRequired: false,
      isEnabled: true,
      displayOrder: 0
    });
    this.fieldOptions = [];
    this.showDialog.set(true);
  }

  openEditDialog(field: any): void {
    this.dialogMode = 'edit';
    
    // Parse validation rules JSON
    const validationRules = this.parseValidationRules(field.validationRules);
    
    this.fieldForm.patchValue({
      id: field.id,
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      placeholder: field.placeholder,
      helpText: field.helpText,
      defaultValue: field.defaultValue,
      isRequired: field.isRequired,
      isEnabled: field.isEnabled,
      minLength: validationRules.minLength,
      maxLength: validationRules.maxLength,
      minValue: validationRules.minValue,
      maxValue: validationRules.maxValue,
      pattern: validationRules.pattern,
      cssClass: field.cssClass,
      displayOrder: field.displayOrder
    });

    // Parse options JSON
    if (field.options) {
      try {
        this.fieldOptions = JSON.parse(field.options);
      } catch {
        this.fieldOptions = [];
      }
    }

    this.showDialog.set(true);
  }

  saveField(): void {
    if (this.fieldForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const formValue = this.fieldForm.value;
    
    // Build validation rules JSON
    const validationRules = this.buildValidationRules(formValue);
    
    // Build options JSON (only for select/radio types)
    const options = this.showOptionsEditor() && this.fieldOptions.length > 0
      ? JSON.stringify(this.fieldOptions)
      : undefined;

    if (this.dialogMode === 'create') {
      const dto = new CreateOnboardingFieldDefinitionDto({
        tenantId: '00000000-0000-0000-0000-000000000000', // Will be set by backend
        fieldKey: formValue.fieldKey,
        fieldLabel: formValue.fieldLabel,
        fieldType: formValue.fieldType,
        placeholder: formValue.placeholder,
        helpText: formValue.helpText,
        defaultValue: formValue.defaultValue,
        isRequired: formValue.isRequired,
        isEnabled: formValue.isEnabled,
        validationRules: validationRules || undefined,
        options: options,
        cssClass: formValue.cssClass,
        displayOrder: formValue.displayOrder,
        icon: undefined,
        minValue: undefined,
        maxValue: undefined,
        maxLength: undefined,
        isUnique: false,
        conditionalDisplay: formValue.conditionalDisplay
      });

      this.fieldClient.onboardingFieldDefinition_Create(dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Field definition created successfully'
          });
          this.showDialog.set(false);
          this.loadFields();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create field definition'
          });
        }
      });
    } else {
      const dto = new UpdateOnboardingFieldDefinitionDto({
        id: formValue.id,
        fieldKey: formValue.fieldKey,
        fieldLabel: formValue.fieldLabel,
        fieldType: formValue.fieldType,
        placeholder: formValue.placeholder,
        helpText: formValue.helpText,
        defaultValue: formValue.defaultValue,
        isRequired: formValue.isRequired,
        isEnabled: formValue.isEnabled,
        validationRules: validationRules || undefined,
        options: options,
        cssClass: formValue.cssClass,
        displayOrder: formValue.displayOrder,
        icon: undefined,
        minValue: undefined,
        maxValue: undefined,
        maxLength: undefined,
        isUnique: false,
        conditionalDisplay: formValue.conditionalDisplay
      });

      this.fieldClient.onboardingFieldDefinition_Update(dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Field definition updated successfully'
          });
          this.showDialog.set(false);
          this.loadFields();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update field definition'
          });
        }
      });
    }
  }

  deleteField(field: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the field "${field.fieldLabel}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fieldClient.onboardingFieldDefinition_Delete(field.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Field definition deleted successfully'
            });
            this.loadFields();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete field definition'
            });
          }
        });
      }
    });
  }

  // Options Management
  addOption(): void {
    this.fieldOptions.push({ value: '', label: '' });
  }

  removeOption(index: number): void {
    this.fieldOptions.splice(index, 1);
  }

  private loadOptionsFromForm(): void {
    // Keep existing options when switching to select/radio
  }

  private parseValidationRules(rulesJson?: string | null): any {
    if (!rulesJson) return {};
    try {
      return JSON.parse(rulesJson);
    } catch {
      return {};
    }
  }

  private buildValidationRules(formValue: any): string | null {
    const rules: any = {};
    
    if (formValue.minLength) rules.minLength = formValue.minLength;
    if (formValue.maxLength) rules.maxLength = formValue.maxLength;
    if (formValue.minValue) rules.minValue = formValue.minValue;
    if (formValue.maxValue) rules.maxValue = formValue.maxValue;
    if (formValue.pattern) rules.pattern = formValue.pattern;

    return Object.keys(rules).length > 0 ? JSON.stringify(rules) : null;
  }

  getFieldTypeLabel(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.label || type;
  }

  getFieldTypeIcon(type: string): string {
    return this.fieldTypes.find(t => t.value === type)?.icon || 'pi pi-question';
  }
}
