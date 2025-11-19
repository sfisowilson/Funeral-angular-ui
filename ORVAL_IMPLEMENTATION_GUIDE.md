# Orval Implementation Complete! 🎉

## What Was Set Up

### 1. Configuration Files
- **orval.config.ts** - Orval configuration pointing to your NodeAPI Swagger endpoint
- **custom-instance.ts** - Custom HTTP client wrapper for Angular (for future use)
- **ORVAL_SETUP.md** - Detailed usage documentation

### 2. NPM Script Added
- `npm run generate:api` - Generates TypeScript API clients from OpenAPI spec

### 3. Helper Scripts
- **setup-orval-dirs.bat** - Creates required directories
- **generate-api-clients.bat** - One-click generation with validation

## Quick Start

### Step 1: Setup Directories (First Time Only)
```bash
cd Frontend
setup-orval-dirs.bat
```

### Step 2: Start Your NodeAPI
```bash
cd NodeAPI
npm run start:dev
```
This exposes your Swagger/OpenAPI spec at: `http://localhost:3000/api-docs/swagger.json`

### Step 3: Generate API Clients
Option A - Using the helper script:
```bash
cd Frontend
generate-api-clients.bat
```

Option B - Using npm directly:
```bash
cd Frontend
npm run generate:api
```

## What Gets Generated

```
Frontend/src/app/core/
├── models/                          # TypeScript interfaces
│   ├── index.ts                     # Barrel export
│   ├── memberDto.ts                 # Example model
│   ├── policyDto.ts                 # Example model
│   └── ...                          # All your DTOs
│
└── services/
    └── generated/                   # Angular services
        ├── index.ts                 # Barrel export
        ├── member.service.ts        # MemberService
        ├── policy.service.ts        # PolicyService
        └── ...                      # One service per Swagger tag
```

## Using Generated Services

### Import and Inject
```typescript
import { Component, inject } from '@angular/core';
import { MemberService } from './core/services/generated';
import { MemberDto } from './core/models';

@Component({
  selector: 'app-members',
  template: `...`
})
export class MembersComponent {
  private memberService = inject(MemberService);
  
  members: MemberDto[] = [];
  
  ngOnInit() {
    this.memberService.apiMemberMemberGetAllGet().subscribe({
      next: (members) => {
        this.members = members;
      },
      error: (error: any) => {
        console.error('Failed to load members:', error);
      }
    });
  }
}
```

### Benefits
- ✅ **Full type safety** - TypeScript interfaces for all DTOs
- ✅ **Auto-complete** - IntelliSense for all API methods
- ✅ **Observable-based** - Native RxJS observables
- ✅ **Tag-based organization** - One service file per API tag
- ✅ **No manual updates** - Regenerate when API changes

## Migration from NSwag

### Old (NSwag)
```typescript
import { MemberServiceProxy } from './core/services/service-proxies';

constructor(private memberService: MemberServiceProxy) {}
```

### New (Orval)
```typescript
import { MemberService } from './core/services/generated';

private memberService = inject(MemberService);
```

## Workflow

1. **Make API changes** in NodeAPI
2. **Ensure NodeAPI is running** (`npm run start:dev`)
3. **Regenerate clients** in Frontend (`npm run generate:api`)
4. **Update your Angular code** with new types/methods
5. **TypeScript compiler** will catch any breaking changes

## Configuration Customization

Edit `orval.config.ts` to customize:

```typescript
export default defineConfig({
  funeralApi: {
    input: {
      target: 'http://localhost:3000/api-docs/swagger.json',
      // Or use a local file:
      // target: './swagger.json',
    },
    output: {
      mode: 'tags-split',  // 'single' | 'split' | 'tags' | 'tags-split'
      target: './src/app/core/services/generated',
      schemas: './src/app/core/models',
      client: 'angular',   // 'angular' | 'axios' | 'react-query' | etc
      mock: false,         // Set to true to generate mock data
      baseUrl: 'http://localhost:3000',
    },
  },
});
```

## Advanced: Custom HTTP Instance

The `custom-instance.ts` file is provided for when you need:
- Custom headers (auth tokens, tenant IDs)
- Request/response interceptors
- Error handling
- Base URL from environment

To use it, update `orval.config.ts`:
```typescript
output: {
  // ... other config
  override: {
    mutator: {
      path: './src/app/core/services/custom-instance.ts',
      name: 'customInstance',
    },
  },
},
```

## Troubleshooting

### "Cannot connect to http://localhost:3000"
- Ensure NodeAPI is running: `cd NodeAPI && npm run start:dev`
- Check the port in NodeAPI (default: 3000)
- Verify swagger endpoint: `http://localhost:3000/api-docs`

### "Module not found" errors after generation
- Run `npm install` in Frontend directory
- Ensure `@angular/common/http` is installed
- Check that TypeScript can resolve the paths

### Generated files not found
- Run `setup-orval-dirs.bat` to create directories
- Check that Orval completed without errors
- Verify output paths in `orval.config.ts`

### Type errors in generated code
- Your OpenAPI spec may have issues
- Check NodeAPI swagger-jsdoc configuration
- Validate your DTOs and schemas in NodeAPI

## Next Steps

1. ✅ Run `setup-orval-dirs.bat`
2. ✅ Start NodeAPI
3. ✅ Run `npm run generate:api`
4. 🔄 Update imports in your Angular components
5. 🔄 Test your API calls
6. 🔄 Remove old NSwag files when confident

## Resources

- [Orval Documentation](https://orval.dev/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Angular HttpClient](https://angular.io/guide/http)

---

**Note**: Remember to regenerate clients whenever you make changes to your NodeAPI that affect the API contract (new endpoints, changed request/response types, etc.).
