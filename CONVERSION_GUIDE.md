# Quick Start Guide: PrimeNG to Bootstrap Conversion

## ✅ Current Status
**Build Status:** FULLY WORKING - ZERO ERRORS  
**PrimeNG:** Still installed and available  
**Ready for:** Systematic manual conversion

---

## How to Start Converting Pages

### Step 1: Choose a Page to Convert
Start with a **simple, low-traffic page** to develop your conversion process. Recommended starter pages:
- About Us page
- Contact page
- Simple list pages without complex interactions

**Avoid starting with:**
- Dashboard (too complex)
- Authentication pages (too critical)
- Payment/contract pages (too sensitive)

### Step 2: Audit PrimeNG Usage
Before converting, identify what PrimeNG components are used:

```powershell
# Search for PrimeNG component usage in a specific file
Get-Content "path/to/component.html" | Select-String "p-"

# Search for PrimeNG imports in TypeScript
Get-Content "path/to/component.ts" | Select-String "from 'primeng"
```

### Step 3: Find Bootstrap/Angular Material Equivalents

| PrimeNG Component | Bootstrap Alternative | Angular Material Alternative |
|-------------------|----------------------|------------------------------|
| `p-button` | `<button class="btn btn-primary">` | `<button mat-button>` |
| `p-table` | `<table class="table">` | `<mat-table>` |
| `p-dialog` | Bootstrap Modal | `<mat-dialog>` |
| `p-dropdown` | `<select class="form-select">` | `<mat-select>` |
| `p-inputText` | `<input class="form-control">` | `<mat-input>` |
| `p-calendar` | `<input type="date" class="form-control">` | `<mat-datepicker>` |
| `p-checkbox` | `<input type="checkbox" class="form-check-input">` | `<mat-checkbox>` |
| `p-multiSelect` | `<select multiple class="form-select">` | `<mat-select multiple>` |
| `p-accordion` | Bootstrap Accordion | `<mat-expansion-panel>` |
| `p-card` | `<div class="card">` | `<mat-card>` |
| `p-toast` | Bootstrap Toast | `MatSnackBar` |
| `p-menu` | Bootstrap Dropdown | `<mat-menu>` |
| `p-panel` | `<div class="card">` | `<mat-card>` |
| `p-tabView` | Bootstrap Tabs | `<mat-tab-group>` |
| `p-confirmDialog` | Bootstrap Modal | `MatDialog` |

### Step 4: Update the Component

#### A. Update HTML Template
Replace PrimeNG components with Bootstrap equivalents.

**Before (PrimeNG):**
```html
<p-button label="Save" icon="pi pi-save" (onClick)="save()"></p-button>
```

**After (Bootstrap):**
```html
<button type="button" class="btn btn-primary" (click)="save()">
  <i class="bi bi-save"></i> Save
</button>
```

#### B. Update TypeScript Imports
Remove PrimeNG imports, add Angular Material if needed.

**Before:**
```typescript
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, TableModule]
})
```

**After:**
```typescript
// Bootstrap doesn't need imports, just CSS classes
// Or add Angular Material:
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  imports: [MatButtonModule, MatTableModule]
})
```

#### C. Update Component Logic
Some PrimeNG components have special APIs that need to be replaced:

**PrimeNG ConfirmationService:**
```typescript
this.confirmationService.confirm({
  message: 'Are you sure?',
  accept: () => { /* delete */ }
});
```

**Bootstrap Modal (manual):**
```typescript
showConfirmModal = false;
confirmAction: (() => void) | null = null;

showConfirm(message: string, action: () => void) {
  this.confirmMessage = message;
  this.confirmAction = action;
  this.showConfirmModal = true;
}
```

### Step 5: Update Styles
Remove PrimeNG-specific styles and add Bootstrap utility classes:

**Before:**
```scss
::ng-deep .p-button {
  margin: 10px;
}
```

**After:**
```html
<!-- Use Bootstrap utility classes -->
<button class="btn btn-primary m-2">Save</button>
```

Or use custom CSS:
```scss
.custom-button {
  margin: 10px;
}
```

### Step 6: Test Thoroughly
- ✅ Visual appearance matches original
- ✅ All interactions work (clicks, inputs, etc.)
- ✅ Form validation works
- ✅ Responsive design works on mobile
- ✅ No console errors
- ✅ No missing functionality

### Step 7: Run Development Server
```powershell
cd c:\Projects\Funeral\Frontend
npm start
```

Navigate to `http://localhost:4200` and test your changes.

### Step 8: Commit Your Changes
```powershell
git add .
git commit -m "Convert [page-name] from PrimeNG to Bootstrap"
```

---

## Example: Complete Conversion

### Example Component: User List

#### Before (PrimeNG)
**user-list.component.html:**
```html
<p-table [value]="users" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-user>
    <tr>
      <td>{{user.name}}</td>
      <td>{{user.email}}</td>
      <td>
        <p-button label="Edit" icon="pi pi-pencil" (onClick)="edit(user)"></p-button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

**user-list.component.ts:**
```typescript
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [TableModule, ButtonModule]
})
export class UserListComponent {
  users = [];
}
```

#### After (Bootstrap)
**user-list.component.html:**
```html
<div class="table-responsive">
  <table class="table table-striped table-hover">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let user of paginatedUsers">
        <td>{{user.name}}</td>
        <td>{{user.email}}</td>
        <td>
          <button class="btn btn-sm btn-primary" (click)="edit(user)">
            <i class="bi bi-pencil"></i> Edit
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Pagination -->
<nav *ngIf="totalPages > 1">
  <ul class="pagination">
    <li class="page-item" [class.disabled]="currentPage === 1">
      <a class="page-link" (click)="goToPage(currentPage - 1)">Previous</a>
    </li>
    <li class="page-item" *ngFor="let page of pages" [class.active]="page === currentPage">
      <a class="page-link" (click)="goToPage(page)">{{page}}</a>
    </li>
    <li class="page-item" [class.disabled]="currentPage === totalPages">
      <a class="page-link" (click)="goToPage(currentPage + 1)">Next</a>
    </li>
  </ul>
</nav>
```

**user-list.component.ts:**
```typescript
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule]
})
export class UserListComponent {
  users = [];
  currentPage = 1;
  pageSize = 10;
  
  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }
  
  get totalPages() {
    return Math.ceil(this.users.length / this.pageSize);
  }
  
  get pages() {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
```

---

## Tips and Best Practices

### 1. Convert One Component at a Time
Don't try to convert multiple pages simultaneously. Focus on one component until it's perfect.

### 2. Keep PrimeNG for Reference
Since PrimeNG is still installed, you can:
- Reference the old implementation
- Compare side-by-side
- Roll back if needed

### 3. Use Bootstrap Documentation
- [Bootstrap Components](https://getbootstrap.com/docs/5.3/components/)
- [Bootstrap Forms](https://getbootstrap.com/docs/5.3/forms/)
- [Bootstrap Utilities](https://getbootstrap.com/docs/5.3/utilities/)

### 4. Consider Angular Material for Complex Components
For components like data tables with advanced features, Angular Material might be a better fit than pure Bootstrap:
- Sortable tables
- Expandable rows
- Column resizing
- Advanced date pickers

### 5. Create Reusable Components
If you find yourself repeating Bootstrap patterns, create reusable components:

```typescript
// shared/components/confirm-modal/confirm-modal.component.ts
@Component({
  selector: 'app-confirm-modal',
  template: `
    <div class="modal" [class.show]="visible" [style.display]="visible ? 'block' : 'none'">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="btn-close" (click)="onCancel()"></button>
          </div>
          <div class="modal-body">{{message}}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="onConfirm()">Confirm</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" [class.show]="visible" *ngIf="visible"></div>
  `
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  
  onConfirm() {
    this.confirm.emit();
  }
  
  onCancel() {
    this.cancel.emit();
  }
}
```

### 6. Check for PrimeNG Services
Some PrimeNG functionality uses services that need to be replaced:
- `ConfirmationService` → Custom modal or MatDialog
- `MessageService` → Bootstrap Toast or MatSnackBar
- `DialogService` → Custom modal service

### 7. Test on Multiple Devices
Bootstrap is responsive, but always test:
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

---

## Common Patterns

### Alert Messages
**PrimeNG:**
```html
<p-messages [(value)]="messages"></p-messages>
```

**Bootstrap:**
```html
<div class="alert alert-{{alert.type}} alert-dismissible" *ngFor="let alert of alerts">
  {{alert.message}}
  <button type="button" class="btn-close" (click)="closeAlert(alert)"></button>
</div>
```

### Loading Spinner
**PrimeNG:**
```html
<p-progressSpinner *ngIf="loading"></p-progressSpinner>
```

**Bootstrap:**
```html
<div class="text-center" *ngIf="loading">
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
</div>
```

### Form Input
**PrimeNG:**
```html
<p-inputText [(ngModel)]="user.name"></p-inputText>
```

**Bootstrap:**
```html
<input type="text" class="form-control" [(ngModel)]="user.name">
```

---

## Tracking Progress

Create a checklist of pages to convert:

```markdown
## Conversion Progress

### Authentication
- [ ] Login Page
- [ ] Register Page
- [ ] Password Reset

### Dashboard
- [ ] Main Dashboard
- [ ] Admin Dashboard

### Management
- [ ] User List
- [ ] User Detail
- [ ] Role Management

... etc
```

---

## Next Steps

1. **Choose your first page** (recommend a simple one)
2. **Follow this guide** step by step
3. **Test thoroughly** before moving to the next page
4. **Document any challenges** you encounter
5. **Update the conversion checklist** as you go

**Good luck with your conversion!** 🚀
