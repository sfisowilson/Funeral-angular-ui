import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { OnboardingStepAdminService, OnboardingStepConfigurationDto, ListDisplayColumnConfig, ListDisplayConfig } from '../../../core/services/onboarding-step-admin.service';

@Component({
    selector: 'app-onboarding-step-list-config',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, TableModule, DialogModule, InputTextModule, InputNumberModule, CheckboxModule, ButtonModule],
    providers: [MessageService],
    templateUrl: './onboarding-step-list-config.component.html',
    styleUrls: ['./onboarding-step-list-config.component.scss']
})
export class OnboardingStepListConfigComponent implements OnInit {
    steps: OnboardingStepConfigurationDto[] = [];
    loading = false;

    dialogVisible = false;
    selectedStep: OnboardingStepConfigurationDto | null = null;

    // List display configuration form model
    minItems: number | null = null;
    maxItems: number | null = null;
    enforceOnNavigation = true;
    showWarningsOnly = false;
    singularLabel = 'Item';
    pluralLabel = 'Items';

    columns: ListDisplayColumnConfig[] = [];
    actions = {
        add: true,
        edit: true,
        delete: true,
        view: false
    };

    defaultSortField = '';
    defaultSortDirection: 'asc' | 'desc' = 'asc';

    constructor(
        private stepService: OnboardingStepAdminService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadSteps();
    }

    loadSteps(): void {
        this.loading = true;
        this.stepService.getAllSteps().subscribe({
            next: (steps) => {
                // Prioritize steps bound to dynamic entities (multi-submit) at the top
                this.steps = (steps || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading onboarding steps', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load onboarding steps: ' + (error?.error?.message || error?.message || 'Unknown error'),
                    life: 5000
                });
                this.loading = false;
            }
        });
    }

    hasListConfig(step: OnboardingStepConfigurationDto): boolean {
        return !!step.listDisplayConfig;
    }

    isMultiSubmitStep(step: OnboardingStepConfigurationDto): boolean {
        // Heuristic: steps bound to a DynamicEntityType are candidates for multi-submit
        return !!step.dynamicEntityTypeKey;
    }

    openConfigDialog(step: OnboardingStepConfigurationDto): void {
        this.selectedStep = step;
        this.loadFromStep(step);
        this.dialogVisible = true;
    }

    hideDialog(): void {
        this.dialogVisible = false;
        this.selectedStep = null;
    }

    addColumn(): void {
        this.columns.push({ fieldKey: '', header: '', width: '', format: '' });
    }

    removeColumn(index: number): void {
        this.columns.splice(index, 1);
    }

    private loadFromStep(step: OnboardingStepConfigurationDto): void {
        // Defaults
        this.minItems = null;
        this.maxItems = null;
        this.enforceOnNavigation = true;
        this.showWarningsOnly = false;
        this.singularLabel = 'Item';
        this.pluralLabel = 'Items';
        this.columns = [];
        this.actions = { add: true, edit: true, delete: true, view: false };
        this.defaultSortField = '';
        this.defaultSortDirection = 'asc';

        if (!step.listDisplayConfig) {
            return;
        }

        try {
            const parsed: ListDisplayConfig | any = JSON.parse(step.listDisplayConfig);

            if (Array.isArray((parsed as any).columns)) {
                this.columns = (parsed as any).columns.map((c: any) => ({
                    fieldKey: c.fieldKey || '',
                    header: c.header || '',
                    width: c.width,
                    format: c.format
                }));
            }

            if ((parsed as any).actions) {
                this.actions = {
                    add: !!(parsed as any).actions.add,
                    edit: !!(parsed as any).actions.edit,
                    delete: !!(parsed as any).actions.delete,
                    view: !!(parsed as any).actions.view
                };
            }

            const constraints = (parsed as any).constraints || parsed;
            if (constraints) {
                if (typeof constraints.minItems === 'number') {
                    this.minItems = constraints.minItems;
                }
                if (typeof constraints.maxItems === 'number') {
                    this.maxItems = constraints.maxItems;
                }
                if (typeof constraints.enforceOnNavigation === 'boolean') {
                    this.enforceOnNavigation = constraints.enforceOnNavigation;
                }
                if (typeof constraints.showWarningsOnly === 'boolean') {
                    this.showWarningsOnly = constraints.showWarningsOnly;
                }
                if (constraints.labels) {
                    this.singularLabel = constraints.labels.singular || this.singularLabel;
                    this.pluralLabel = constraints.labels.plural || this.pluralLabel;
                }
            }

            if ((parsed as any).defaultSort) {
                this.defaultSortField = (parsed as any).defaultSort.field || '';
                this.defaultSortDirection = (parsed as any).defaultSort.direction === 'desc' ? 'desc' : 'asc';
            }
        } catch (e) {
            console.warn('Invalid listDisplayConfig JSON for step', step.stepKey, e);
        }
    }

    saveConfig(): void {
        if (!this.selectedStep) {
            return;
        }

        const cleanedColumns = this.columns.filter((c) => c.fieldKey && c.header);

        const config: ListDisplayConfig = {
            columns: cleanedColumns,
            actions: { ...this.actions },
            constraints: {
                minItems: this.minItems ?? undefined,
                maxItems: this.maxItems ?? undefined,
                enforceOnNavigation: this.enforceOnNavigation,
                showWarningsOnly: this.showWarningsOnly,
                labels: {
                    singular: this.singularLabel || 'Item',
                    plural: this.pluralLabel || 'Items'
                }
            },
            defaultSort: this.defaultSortField
                ? {
                      field: this.defaultSortField,
                      direction: this.defaultSortDirection
                  }
                : undefined
        };

        const json = JSON.stringify(config, null, 2);

        this.loading = true;
        this.stepService.updateListDisplayConfig(this.selectedStep, json).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: 'List configuration updated successfully',
                    life: 3000
                });
                // Update local copy so future edits start from latest config
                this.selectedStep!.listDisplayConfig = json;
                this.hideDialog();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error saving list configuration', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save list configuration: ' + (error?.error?.message || error?.message || 'Unknown error'),
                    life: 5000
                });
                this.loading = false;
            }
        });
    }
}
