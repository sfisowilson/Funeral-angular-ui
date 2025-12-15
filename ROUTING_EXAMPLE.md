# Add PDF Field Mapping Route

## Option 1: Add to App Routes (Recommended)

Open `src/app/app.routes.ts` and add this route:

```typescript
import { Routes } from '@angular/router';
import { PdfFieldMappingComponent } from './pages/pdf-field-mapping/pdf-field-mapping.component';

export const routes: Routes = [
  // ... your existing routes ...
  
  {
    path: 'pdf-field-mapping',
    component: PdfFieldMappingComponent,
    // Add auth guard if needed:
    // canActivate: [AuthGuard],
    // data: { roles: ['Admin'] }
  },
  
  // ... rest of routes ...
];
```

## Option 2: Lazy Load (For Better Performance)

```typescript
{
  path: 'pdf-field-mapping',
  loadComponent: () => import('./pages/pdf-field-mapping/pdf-field-mapping.component')
    .then(m => m.PdfFieldMappingComponent),
  // canActivate: [AuthGuard],
  // data: { roles: ['Admin'] }
}
```

## Add Navigation Link

### In Admin Menu/Sidebar

```html
<a routerLink="/pdf-field-mapping" class="menu-item">
  <i class="pi pi-sitemap"></i>
  <span>PDF Field Mapping</span>
</a>
```

### Or in PrimeNG Menu

```typescript
// In your menu component
menuItems = [
  {
    label: 'Admin',
    items: [
      {
        label: 'PDF Field Mapping',
        icon: 'pi pi-sitemap',
        routerLink: ['/pdf-field-mapping']
      }
    ]
  }
];
```

## Test the Route

1. Start the frontend: `ng serve` or `npm start`
2. Navigate to: `http://localhost:4200/pdf-field-mapping`
3. You should see the PDF Field Mapping page

## Next Steps

After adding the route, you'll need a template file ID to test the "Analyze Template" feature. You can:

1. Upload a PDF template through your existing upload system
2. Get the file ID from the database (FileUpload table)
3. Pass it to the `analyzeTemplate(templateFileId)` method
4. Or add a dropdown to select from available templates

## Quick Test

To quickly test without a real template, you can:

1. Click "Create Mapping"
2. Fill in:
   - Source Field: `Title`
   - Mapping Type: `Conditional`
   - Click "Add Rule" 
   - Condition: `value == 'Mr'`
   - PDF Field: `checkbox_Mr`
   - Set Value: `Yes`
3. Save
4. Verify it appears in the table
5. Try editing, toggling, and deleting

The system is now ready to use! 🎉
