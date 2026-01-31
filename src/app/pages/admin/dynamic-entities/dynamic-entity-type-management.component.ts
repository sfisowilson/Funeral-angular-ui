
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicEntityServiceProxy, DynamicEntityTypeDto } from '@app/core/services/service-proxies';
import { DynamicEntityTypeWidgetComponent } from '@app/building-blocks/dynamic-entity-type-widget/dynamic-entity-type-widget.component';
import { AuthService } from '@app/auth/auth-service';

@Component({
  selector: 'app-dynamic-entity-type-management',
  templateUrl: './dynamic-entity-type-management.component.html',
  styleUrls: ['./dynamic-entity-type-management.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicEntityTypeWidgetComponent],
  providers: [DynamicEntityServiceProxy]
})
export class DynamicEntityTypeManagementComponent implements OnInit {
  entityTypes: DynamicEntityTypeDto[] = [];
  loading = false;
  error = '';
  showDialog = false;
  selectedType: DynamicEntityTypeDto | null = null;

  constructor(private entityTypeService: DynamicEntityServiceProxy, private authService: AuthService) {}

  get canCreateOrUpdate(): boolean {
    return this.authService.hasAnyPermission([
      'Permission.dynamicEntityType.create',
      'Permission.dynamicEntityType.update'
    ]);
  }

  get canDelete(): boolean {
    return this.authService.hasPermission('Permission.dynamicEntityType.delete');
  }

  ngOnInit() {
    this.refreshTypes();
  }

  refreshTypes() {
    this.loading = true;
    this.error = '';
    this.entityTypeService.entityType_GetAll().subscribe({
      next: (response) => {
        this.entityTypes = response?.result || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load entity types.';
        this.loading = false;
      }
    });
  }

  openCreateDialog() {
    this.selectedType = null;
    this.showDialog = true;
  }

  openEditDialog(type: DynamicEntityTypeDto) {
    this.selectedType = type;
    this.showDialog = true;
  }

  closeDialog(saved: boolean) {
    this.showDialog = false;
    this.selectedType = null;
    if (saved) {
      this.refreshTypes();
    }
  }

  deleteType(type: DynamicEntityTypeDto) {
    if (confirm('Delete this entity type?')) {
      this.entityTypeService.entityType_Delete(type.id).subscribe({
        next: () => this.refreshTypes(),
        error: () => this.error = 'Failed to delete entity type.'
      });
    }
  }
}
