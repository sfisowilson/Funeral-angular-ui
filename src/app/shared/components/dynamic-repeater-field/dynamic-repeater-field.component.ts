import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

/**
 * Configuration for a field in the repeater
 */
export interface RepeaterFieldConfig {
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox';
    placeholder?: string;
    options?: string[]; // For select/dropdown fields
    required?: boolean;
}

/**
 * Configuration for the repeater component
 */
export interface RepeaterConfig {
    fields: RepeaterFieldConfig[];
    singularLabel: string; // e.g., "Dependent"
    pluralLabel: string;   // e.g., "Dependents"
    minItems?: number;
    maxItems?: number;
    allowAdd?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
}

@Component({
    selector: 'app-dynamic-repeater-field',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        DropdownModule,
        CalendarModule,
        CheckboxModule,
        TooltipModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        
        <div class="dynamic-repeater">
            <!-- Header with Add Button -->
            <div class="repeater-header">
                <h5 class="mb-0">{{ config().pluralLabel }}</h5>
                <button 
                    *ngIf="config().allowAdd !== false && !isMaxItemsReached()"
                    pButton 
                    type="button"
                    [label]="'Add ' + config().singularLabel" 
                    icon="pi pi-plus" 
                    (click)="openDialog()"
                    class="p-button-sm p-button-success">
                </button>
            </div>

            <!-- Info Messages -->
            <div *ngIf="isMinItemsRequired() && items().length < config().minItems!" class="alert alert-info mt-2">
                <i class="pi pi-info-circle"></i>
                You must add at least {{ config().minItems }} {{ config().pluralLabel.toLowerCase() }}.
            </div>
            
            <div *ngIf="isMaxItemsReached()" class="alert alert-warning mt-2">
                <i class="pi pi-exclamation-triangle"></i>
                Maximum of {{ config().maxItems }} {{ config().pluralLabel.toLowerCase() }} reached.
            </div>

            <!-- Items Table -->
            <p-table 
                *ngIf="items().length > 0"
                [value]="items()" 
                styleClass="p-datatable-sm mt-3"
                [tableStyle]="{ 'min-width': '50rem' }">
                
                <ng-template pTemplate="header">
                    <tr>
                        <th *ngFor="let field of config().fields">{{ field.fieldLabel }}</th>
                        <th style="width: 120px">Actions</th>
                    </tr>
                </ng-template>
                
                <ng-template pTemplate="body" let-item let-i="rowIndex">
                    <tr>
                        <td *ngFor="let field of config().fields">
                            {{ getDisplayValue(item, field) }}
                        </td>
                        <td>
                            <button 
                                *ngIf="config().allowEdit !== false"
                                pButton 
                                type="button"
                                icon="pi pi-pencil" 
                                (click)="editItem(i)"
                                class="p-button-sm p-button-text p-button-rounded"
                                pTooltip="Edit">
                            </button>
                            <button 
                                *ngIf="config().allowDelete !== false"
                                pButton 
                                type="button"
                                icon="pi pi-trash" 
                                (click)="deleteItem(i)"
                                class="p-button-sm p-button-text p-button-rounded p-button-danger"
                                pTooltip="Delete">
                            </button>
                        </td>
                    </tr>
                </ng-template>
                
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td [attr.colspan]="config().fields.length + 1" class="text-center">
                            No {{ config().pluralLabel.toLowerCase() }} added yet.
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <!-- Dialog for Adding/Editing Items -->
            <p-dialog 
                [(visible)]="showDialog" 
                [header]="dialogTitle()"
                [modal]="true" 
                [style]="{ width: '600px' }"
                [draggable]="false" 
                [resizable]="false">
                
                <div class="form-container">
                    <div *ngFor="let field of config().fields" class="field-group mb-3">
                        <label [for]="field.fieldKey" class="field-label">
                            {{ field.fieldLabel }}
                            <span *ngIf="field.required" class="required-asterisk">*</span>
                        </label>
                        
                        <!-- Text, Email, Tel -->
                        <input 
                            *ngIf="['text', 'email', 'tel'].includes(field.fieldType)"
                            [id]="field.fieldKey"
                            [(ngModel)]="currentItem[field.fieldKey]"
                            [type]="field.fieldType"
                            [placeholder]="field.placeholder || ''"
                            class="form-control"
                        />
                        
                        <!-- Number -->
                        <input 
                            *ngIf="field.fieldType === 'number'"
                            [id]="field.fieldKey"
                            [(ngModel)]="currentItem[field.fieldKey]"
                            type="number"
                            [placeholder]="field.placeholder || ''"
                            class="form-control"
                        />
                        
                        <!-- Date -->
                        <p-calendar
                            *ngIf="field.fieldType === 'date'"
                            [id]="field.fieldKey"
                            [(ngModel)]="currentItem[field.fieldKey]"
                            [placeholder]="field.placeholder || 'Select date'"
                            dateFormat="yy-mm-dd"
                            [showIcon]="true"
                            class="w-100">
                        </p-calendar>
                        
                        <!-- Select/Dropdown -->
                        <p-dropdown
                            *ngIf="field.fieldType === 'select'"
                            [id]="field.fieldKey"
                            [(ngModel)]="currentItem[field.fieldKey]"
                            [options]="field.options || []"
                            [placeholder]="field.placeholder || 'Select an option'"
                            class="w-100">
                        </p-dropdown>
                        
                        <!-- Checkbox -->
                        <div *ngIf="field.fieldType === 'checkbox'" class="flex align-items-center">
                            <p-checkbox
                                [id]="field.fieldKey"
                                [(ngModel)]="currentItem[field.fieldKey]"
                                [binary]="true">
                            </p-checkbox>
                            <label [for]="field.fieldKey" class="ms-2">{{ field.fieldLabel }}</label>
                        </div>
                    </div>
                </div>
                
                <ng-template pTemplate="footer">
                    <button 
                        pButton 
                        type="button"
                        label="Cancel" 
                        icon="pi pi-times" 
                        (click)="closeDialog()"
                        class="p-button-text">
                    </button>
                    <button 
                        pButton 
                        type="button"
                        label="Save" 
                        icon="pi pi-check" 
                        (click)="saveItem()"
                        class="p-button-primary">
                    </button>
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [`
        .dynamic-repeater {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1.5rem;
            background-color: #fafafa;
        }

        .repeater-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .field-group {
            margin-bottom: 1rem;
        }

        .field-label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #333;
        }

        .required-asterisk {
            color: #e74c3c;
            margin-left: 2px;
        }

        .form-control {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
        }

        .alert {
            padding: 0.75rem 1rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .alert-info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }

        .alert-warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }

        :host ::ng-deep .p-datatable {
            border: 1px solid #e0e0e0;
        }

        :host ::ng-deep .p-calendar {
            width: 100%;
        }

        :host ::ng-deep .p-dropdown {
            width: 100%;
        }
    `]
})
export class DynamicRepeaterFieldComponent implements OnInit {
    @Input() config = signal<RepeaterConfig>({
        fields: [],
        singularLabel: 'Item',
        pluralLabel: 'Items',
        allowAdd: true,
        allowEdit: true,
        allowDelete: true
    });
    
    @Input() value: any[] = [];
    @Output() valueChange = new EventEmitter<any[]>();

    items = signal<any[]>([]);
    showDialog = false;
    currentItem: any = {};
    editingIndex: number | null = null;

    constructor(private messageService: MessageService) {}

    ngOnInit() {
        // Initialize items from value
        if (this.value && Array.isArray(this.value)) {
            this.items.set([...this.value]);
        }
    }

    dialogTitle(): string {
        return this.editingIndex !== null 
            ? `Edit ${this.config().singularLabel}` 
            : `Add ${this.config().singularLabel}`;
    }

    openDialog() {
        this.currentItem = {};
        this.editingIndex = null;
        this.showDialog = true;
    }

    editItem(index: number) {
        this.currentItem = { ...this.items()[index] };
        this.editingIndex = index;
        this.showDialog = true;
    }

    deleteItem(index: number) {
        const updatedItems = [...this.items()];
        updatedItems.splice(index, 1);
        this.items.set(updatedItems);
        this.valueChange.emit(updatedItems);
        
        this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: `${this.config().singularLabel} deleted successfully`
        });
    }

    saveItem() {
        // Validate required fields
        for (const field of this.config().fields) {
            if (field.required && !this.currentItem[field.fieldKey]) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validation Error',
                    detail: `${field.fieldLabel} is required`
                });
                return;
            }
        }

        const updatedItems = [...this.items()];
        
        if (this.editingIndex !== null) {
            // Update existing item
            updatedItems[this.editingIndex] = { ...this.currentItem };
            this.messageService.add({
                severity: 'success',
                summary: 'Updated',
                detail: `${this.config().singularLabel} updated successfully`
            });
        } else {
            // Add new item
            updatedItems.push({ ...this.currentItem });
            this.messageService.add({
                severity: 'success',
                summary: 'Added',
                detail: `${this.config().singularLabel} added successfully`
            });
        }
        
        this.items.set(updatedItems);
        this.valueChange.emit(updatedItems);
        this.closeDialog();
    }

    closeDialog() {
        this.showDialog = false;
        this.currentItem = {};
        this.editingIndex = null;
    }

    getDisplayValue(item: any, field: RepeaterFieldConfig): string {
        const value = item[field.fieldKey];
        
        if (value === undefined || value === null) {
            return '-';
        }
        
        if (field.fieldType === 'checkbox') {
            return value ? 'Yes' : 'No';
        }
        
        if (field.fieldType === 'date' && value instanceof Date) {
            return value.toLocaleDateString();
        }
        
        return String(value);
    }

    isMinItemsRequired(): boolean {
        return this.config().minItems !== undefined && this.config().minItems! > 0;
    }

    isMaxItemsReached(): boolean {
        return this.config().maxItems !== undefined && this.items().length >= this.config().maxItems!;
    }
}
