import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    DynamicEntityServiceProxy,
    DynamicEntityRelationDefinitionDto,
    DynamicEntityRecordDto,
    DynamicEntityTypeDto,
    SetRelationsForRecordDto,
    CreateDynamicEntityRelationDefinitionDto,
    UpdateDynamicEntityRelationDefinitionDto
} from '@app/core/services/service-proxies';
import { AuthService } from '@app/auth/auth-service';

@Component({
    selector: 'app-dynamic-entity-relation-management',
    templateUrl: './dynamic-entity-relation-management.component.html',
    styleUrls: ['./dynamic-entity-relation-management.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [DynamicEntityServiceProxy]
})
export class DynamicEntityRelationManagementComponent implements OnInit {
    relationDefinitions: DynamicEntityRelationDefinitionDto[] = [];
    selectedDefinition: DynamicEntityRelationDefinitionDto | null = null;
    showDefinitionDialog = false;

    selectedRelationDefId: string = '';
    fromRecords: DynamicEntityRecordDto[] = [];
    selectedFromRecordId: string = '';
    toRecords: DynamicEntityRecordDto[] = [];
    selectedToRecordIds: string[] = [];
    entityTypes: DynamicEntityTypeDto[] = [];
    loading = false;
    error = '';

    constructor(
        private dynamicEntityService: DynamicEntityServiceProxy,
        private authService: AuthService
    ) {}

    get canCreateOrUpdateDefinitions(): boolean {
        return this.authService.hasAnyPermission(['Permission.dynamicEntityRecord.create', 'Permission.dynamicEntityRecord.update']);
    }

    get canDeleteDefinitions(): boolean {
        return this.authService.hasPermission('Permission.dynamicEntityRecord.delete');
    }

    ngOnInit() {
        this.dynamicEntityService.relationDefinition_GetAll().subscribe({
            next: (response) => (this.relationDefinitions = response?.result || []),
            error: () => (this.error = 'Failed to load relation definitions.')
        });

        this.dynamicEntityService.entityType_GetAll().subscribe({
            next: (response) => (this.entityTypes = response?.result || []),
            error: () => (this.error = 'Failed to load entity types.')
        });
    }

    get fromEntityTypeName(): string {
        if (!this.selectedRelationDefId) return '';
        const def = this.relationDefinitions.find((d) => d.id === this.selectedRelationDefId);
        if (!def) return '';
        const type = this.entityTypes.find((t) => t.id === def.fromEntityTypeId);
        return type?.name ?? '';
    }

    get toEntityTypeName(): string {
        if (!this.selectedRelationDefId) return '';
        const def = this.relationDefinitions.find((d) => d.id === this.selectedRelationDefId);
        if (!def) return '';
        const type = this.entityTypes.find((t) => t.id === def.toEntityTypeId);
        return type?.name ?? '';
    }

    getEntityTypeNameById(id: string | undefined | null): string {
        if (!id) {
            return '';
        }
        const type = this.entityTypes.find((t) => t.id === id);
        return type?.name ?? '';
    }

    openCreateDefinitionDialog() {
        const def = new DynamicEntityRelationDefinitionDto();
        def.cardinality = 'OneToMany';
        def.isBidirectional = true as any;
        this.selectedDefinition = def;
        this.showDefinitionDialog = true;
    }

    openEditDefinitionDialog(def: DynamicEntityRelationDefinitionDto) {
        this.selectedDefinition = def;
        this.showDefinitionDialog = true;
    }

    closeDefinitionDialog() {
        this.showDefinitionDialog = false;
        this.selectedDefinition = null;
    }

    saveDefinition() {
        if (!this.canCreateOrUpdateDefinitions) {
            return;
        }

        const isEdit = !!this.selectedDefinition?.id;

        if (!this.selectedDefinition) {
            this.selectedDefinition = new DynamicEntityRelationDefinitionDto();
        }

        const body = isEdit ? new UpdateDynamicEntityRelationDefinitionDto() : new CreateDynamicEntityRelationDefinitionDto();

        if (isEdit) {
            (body as UpdateDynamicEntityRelationDefinitionDto).id = this.selectedDefinition.id;
        }

        body.name = this.selectedDefinition.name;
        body.key = this.selectedDefinition.key;
        body.fromEntityTypeId = this.selectedDefinition.fromEntityTypeId;
        body.toEntityTypeId = this.selectedDefinition.toEntityTypeId;
        body.cardinality = this.selectedDefinition.cardinality || 'OneToMany';
        body.isBidirectional = this.selectedDefinition.isBidirectional ?? true;
        body.fromLabel = this.selectedDefinition.fromLabel;
        body.toLabel = this.selectedDefinition.toLabel;

        const call = isEdit ? this.dynamicEntityService.relationDefinition_Update(body as UpdateDynamicEntityRelationDefinitionDto) : this.dynamicEntityService.relationDefinition_Create(body as CreateDynamicEntityRelationDefinitionDto);

        this.loading = true;
        this.error = '';

        call.subscribe({
            next: () => {
                this.loading = false;
                this.showDefinitionDialog = false;
                this.selectedDefinition = null;
                this.dynamicEntityService.relationDefinition_GetAll().subscribe({
                    next: (response) => (this.relationDefinitions = response?.result || []),
                    error: () => (this.error = 'Failed to load relation definitions.')
                });
            },
            error: () => {
                this.loading = false;
                this.error = 'Failed to save relation definition.';
            }
        });
    }

    deleteDefinition(def: DynamicEntityRelationDefinitionDto) {
        if (!this.canDeleteDefinitions) {
            return;
        }

        if (!confirm('Delete this relation definition?')) {
            return;
        }

        this.loading = true;
        this.error = '';

        this.dynamicEntityService.relationDefinition_Delete(def.id).subscribe({
            next: () => {
                this.loading = false;
                this.relationDefinitions = this.relationDefinitions.filter((d) => d.id !== def.id);

                if (this.selectedRelationDefId === def.id) {
                    this.selectedRelationDefId = '';
                    this.fromRecords = [];
                    this.selectedFromRecordId = '';
                    this.toRecords = [];
                    this.selectedToRecordIds = [];
                }
            },
            error: () => {
                this.loading = false;
                this.error = 'Failed to delete relation definition.';
            }
        });
    }

    refreshFromRecords() {
        if (!this.selectedRelationDefId) return;
        this.loading = true;
        this.error = '';
        const def = this.relationDefinitions.find((d) => d.id === this.selectedRelationDefId);
        if (!def) {
            this.loading = false;
            return;
        }
        const fromType = this.entityTypes.find((t) => t.id === def.fromEntityTypeId);
        if (!fromType || !fromType.key) {
            this.loading = false;
            this.error = 'Failed to resolve source entity type.';
            return;
        }
        this.dynamicEntityService.record_List(fromType.key, 1, 50, undefined).subscribe({
            next: (response) => {
                const result = response?.result;
                this.fromRecords = result?.records || [];
                this.loading = false;
            },
            error: () => {
                this.error = 'Failed to load from records.';
                this.loading = false;
            }
        });
    }

    refreshToRecords() {
        if (!this.selectedRelationDefId || !this.selectedFromRecordId) return;
        this.loading = true;
        this.error = '';
        const def = this.relationDefinitions.find((d) => d.id === this.selectedRelationDefId);
        if (!def) {
            this.loading = false;
            return;
        }
        const toType = this.entityTypes.find((t) => t.id === def.toEntityTypeId);
        if (!toType || !toType.key) {
            this.loading = false;
            this.error = 'Failed to resolve target entity type.';
            return;
        }
        this.dynamicEntityService.record_List(toType.key, 1, 50, undefined).subscribe({
            next: (response) => {
                const result = response?.result;
                this.toRecords = result?.records || [];
                this.loadExistingRelations();
            },
            error: () => {
                this.error = 'Failed to load to records.';
                this.loading = false;
            }
        });
    }

    loadExistingRelations() {
        this.dynamicEntityService.relations_ForRecord(this.selectedRelationDefId, this.selectedFromRecordId).subscribe({
            next: (response) => {
                const relations = response?.result || [];
                this.selectedToRecordIds = relations.map((r) => r.toRecordId);
                this.loading = false;
            },
            error: () => {
                this.error = 'Failed to load relations.';
                this.loading = false;
            }
        });
    }

    saveRelations() {
        this.loading = true;
        this.error = '';
        const dto = new SetRelationsForRecordDto();
        dto.relationDefinitionId = this.selectedRelationDefId;
        dto.fromRecordId = this.selectedFromRecordId;
        dto.toRecordIds = this.selectedToRecordIds;

        this.dynamicEntityService.relations_SetForRecord(dto).subscribe({
            next: () => {
                this.loading = false;
                alert('Relations saved!');
            },
            error: () => {
                this.error = 'Failed to save relations.';
                this.loading = false;
            }
        });
    }
}
